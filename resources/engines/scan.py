"""Bounded A4 OMR worker. All files are server-created temporary paths."""
import sys, json, os
import cv2
import fitz
import numpy as np

cv2.setNumThreads(1)
WIDTH, HEIGHT = 1588, 2245

def pages(path):
    with open(path, 'rb') as f:
        header = f.read(8)
    if header.startswith(b'%PDF-'):
        with fitz.open(path) as pdf:
            if pdf.is_encrypted or not 1 <= len(pdf) <= 20:
                raise ValueError('Invalid PDF page count or encrypted PDF')
            for page in pdf:
                if abs(page.rect.width - 210/25.4*72) > 12 or abs(page.rect.height - 297/25.4*72) > 12:
                    raise ValueError('Scan PDF must contain A4 portrait pages')
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), colorspace=fitz.csRGB, alpha=False)
                yield cv2.cvtColor(np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, 3), cv2.COLOR_RGB2BGR)
    elif header.startswith(b'\x89PNG') or header.startswith(b'\xff\xd8'):
        # Inspect dimensions before OpenCV allocates a decompressed image.
        from PIL import Image
        with Image.open(path) as image:
            if image.width * image.height > 30_000_000 or min(image.size) < 600:
                raise ValueError('Image must be 600 px or larger and at most 30 MP')
        image = cv2.imread(path)
        if image is None:
            raise ValueError('Invalid image')
        if max(image.shape[:2]) > 3500:
            image = cv2.resize(image, None, fx=3500/max(image.shape[:2]), fy=3500/max(image.shape[:2]))
        yield image
    else:
        raise ValueError('Only PDF, PNG and JPEG scans are supported')

def marker_centers(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(gray, 75, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    height, width = gray.shape
    candidates = []
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        area = cv2.contourArea(contour)
        if .000025 < area/(width*height) < .002 and .55 < w/h < 1.8 and area/(w*h) > .7:
            candidates.append((x+w/2, y+h/2))
    if len(candidates) < 4:
        raise ValueError('Four alignment markers are required')
    result = []
    for tx, ty in [(0,0),(width,0),(0,height),(width,height)]:
        candidate = min(candidates, key=lambda p: ((p[0]-tx)/width)**2+((p[1]-ty)/height)**2)
        if abs(candidate[0]-tx)/width > .25 or abs(candidate[1]-ty)/height > .25:
            raise ValueError('Alignment markers are cropped or outside the expected corners')
        result.append(candidate)
    if len(set(result)) != 4:
        raise ValueError('Ambiguous alignment markers')
    return np.float32(result)

def align(image, pattern):
    detector = cv2.QRCodeDetector()
    for rotation in range(4):
        candidate = np.ascontiguousarray(np.rot90(image, rotation))
        try:
            src = marker_centers(candidate)
        except ValueError:
            continue
        # Marker positions are identical on every page; the QR chooses the page.
        dest = np.float32([(p['x']*WIDTH, p['y']*HEIGHT) for p in pattern['pages'][0]['markers']])
        matrix = cv2.getPerspectiveTransform(src, dest)
        warped = cv2.warpPerspective(candidate, matrix, (WIDTH,HEIGHT), borderValue=(255,255,255))
        qr_roi = warped[0:int(HEIGHT*.11), int(WIDTH*.72):]
        code, _, _ = detector.detectAndDecode(qr_roi)
        if not code:
            code, _, _ = detector.detectAndDecode(warped)
        for index, page in enumerate(pattern['pages']):
            if code == page['code']:
                return index, warped
    raise ValueError('Unreadable sheet identity or wrong exam; include all four corner markers')

def read_sheet(scan_paths, reference_path, pattern):
    references = list(pages(reference_path))
    if len(references) != len(pattern['pages']) or not references:
        raise ValueError('Template page count mismatch')
    by_page = {}
    for path in scan_paths:
        for image in pages(path):
            if len(by_page) >= 20:
                raise ValueError('At most 20 scan pages')
            index, warped = align(image, pattern)
            if index in by_page:
                raise ValueError('Duplicate answer page')
            by_page[index] = warped
    if len(by_page) != len(references):
        raise ValueError('Upload every answer page exactly once')
    readings, previews = [], []
    for index, raw_reference in enumerate(references):
        page = pattern['pages'][index]
        # Align reference through the same marker transform to cancel pixel rounding.
        reference_points = marker_centers(raw_reference)
        dest = np.float32([(p['x']*WIDTH,p['y']*HEIGHT) for p in page['markers']])
        reference = cv2.warpPerspective(raw_reference, cv2.getPerspectiveTransform(reference_points,dest), (WIDTH,HEIGHT), borderValue=(255,255,255))
        aligned = by_page[index]
        gray, baseline = cv2.cvtColor(aligned,cv2.COLOR_BGR2GRAY), cv2.cvtColor(reference,cv2.COLOR_BGR2GRAY)
        printed = baseline < 100
        # Use only printed dark pixels outside answer regions for alignment quality.
        for bubble in page['bubbles']:
            cv2.circle(printed.view(np.uint8), (round(bubble['x']*WIDTH),round(bubble['y']*HEIGHT)), round(bubble['radius']*WIDTH*1.8), 0, -1)
        overlap = float(np.mean(gray[printed] < 190)) if np.any(printed) else 0
        if overlap < .65:
            raise ValueError('Scan is blurred, shifted or does not match the saved template')
        scores = {}
        for bubble in page['bubbles']:
            x,y = round(bubble['x']*WIDTH),round(bubble['y']*HEIGHT)
            radius = max(3, round(bubble['radius']*WIDTH*.68))
            yy,xx=np.ogrid[-radius:radius+1,-radius:radius+1]
            mask=xx*xx+yy*yy <= radius*radius
            current=gray[y-radius:y+radius+1,x-radius:x+radius+1]
            blank=baseline[y-radius:y+radius+1,x-radius:x+radius+1]
            # Difference from the exact blank PDF suppresses printed letters and rings.
            added=(blank.astype(np.int16)-current.astype(np.int16)>45)&(current<170)&mask
            fill=float(added.sum()/mask.sum())
            weak=(blank.astype(np.int16)-current.astype(np.int16)>20)&(current<235)&mask
            weak_fill=float(weak.sum()/mask.sum())
            if fill < .12 and weak_fill >= .12:
                fill=min(.34,max(.12,weak_fill*.3))
            scores.setdefault(bubble['number'],[]).append((bubble['option'],fill))
        for number, values in scores.items():
            marked=[v for v in values if v[1]>=.35]
            uncertain=[v for v in values if .12<=v[1]<.35]
            status='marked' if len(marked)==1 and not uncertain else 'blank' if not marked and not uncertain else 'multiple' if len(marked)>1 else 'uncertain'
            readings.append({'number':number,'answer':marked[0][0] if status=='marked' else None,'status':status,'fills':dict(values),'page':index})
        # Low-resolution review image, including open-answer boxes, never public.
        review=cv2.resize(aligned,(794,1122))
        target=os.path.join(os.path.dirname(reference_path),f'preview-{index}.jpg')
        cv2.imwrite(target,review,[cv2.IMWRITE_JPEG_QUALITY,85])
        previews.append(target)
    return {'readings':sorted(readings,key=lambda r:r['number']),'previews':previews,'pages':len(by_page)}

if __name__ == '__main__':
    try:
        with open(sys.argv[1],encoding='utf-8-sig') as f:
            job=json.load(f)
        result=read_sheet(job['scans'],job['reference'],job['pattern'])
        print(json.dumps(result))
    except Exception as error:
        print(json.dumps({'error':str(error)}))
        sys.exit(1)
