"""Run after the PDF fixture generator: python tests/test_omr.py <fixture-dir>."""
import importlib.util, pathlib, sys, json, tempfile
import fitz
import cv2
import numpy as np

root=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('omr',root/'resources/engines/scan.py')
omr=importlib.util.module_from_spec(spec);spec.loader.exec_module(omr)
folder=pathlib.Path(sys.argv[1]);pattern=json.loads((folder/'pattern.json').read_text())
reference=folder/'answerPdf.pdf'

with tempfile.TemporaryDirectory(prefix='mymath-omr-test-') as tmp:
    tmp=pathlib.Path(tmp)
    def marked_pdf(name, marks, shade=0):
        target=tmp/name
        with fitz.open(reference) as pdf:
            for pi,page_pattern in enumerate(pattern['pages']):
                page=pdf[pi]
                for bubble in page_pattern['bubbles']:
                    if (bubble['number'],bubble['option']) in marks:
                        radius=marks[(bubble['number'],bubble['option'])]
                        page.draw_circle((bubble['x']*page.rect.width,bubble['y']*page.rect.height),bubble['radius']*page.rect.width*radius,color=(shade,shade,shade),fill=(shade,shade,shade),overlay=True)
            pdf.save(target)
        return target
    blank=omr.read_sheet([str(reference)],str(reference),pattern)
    assert all(r['status']=='blank' for r in blank['readings'])
    marked=marked_pdf('marked.pdf',{(1,'C'):.9,(2,'B'):.9})
    result=omr.read_sheet([str(marked)],str(reference),pattern)
    assert [r['answer'] for r in result['readings']]==['C','B'],result
    multiple=marked_pdf('multiple.pdf',{(1,'A'):.9,(1,'C'):.9,(2,'A'):.9})
    result=omr.read_sheet([str(multiple)],str(reference),pattern)
    assert result['readings'][0]['status']=='multiple',result
    faint=marked_pdf('faint.pdf',{(1,'C'):.25})
    result=omr.read_sheet([str(faint)],str(reference),pattern)
    assert result['readings'][0]['status']=='uncertain',result
    light=marked_pdf('light.pdf',{(1,'C'):.9},shade=.78)
    result=omr.read_sheet([str(light)],str(reference),pattern)
    assert result['readings'][0]['status']=='uncertain',result
    # A camera-like perspective, 90-degree rotation, and reversed page order.
    paths=[]
    for index,image in enumerate(omr.pages(str(marked))):
        h,w=image.shape[:2]
        src=np.float32([[0,0],[w-1,0],[0,h-1],[w-1,h-1]])
        dst=np.float32([[70,25],[w-35,50],[25,h-70],[w-20,h-20]])
        warped=cv2.warpPerspective(image,cv2.getPerspectiveTransform(src,dst),(w,h),borderValue=(255,255,255))
        path=tmp/f'camera-{index}.png';cv2.imwrite(str(path),cv2.rotate(warped,cv2.ROTATE_90_CLOCKWISE));paths.append(str(path))
    result=omr.read_sheet(paths[::-1],str(reference),pattern)
    assert [r['answer'] for r in result['readings']]==['C','B'],result
    try:omr.read_sheet([paths[0]],str(reference),pattern)
    except ValueError:pass
    else:raise AssertionError('Missing pages accepted')
    wrong=json.loads(json.dumps(pattern));wrong['pages'][0]['code']='different-exam'
    try:omr.read_sheet([str(marked)],str(reference),wrong)
    except ValueError:pass
    else:raise AssertionError('Wrong exam accepted')
    print('OMR: blank, filled, multiple, faint, perspective, rotation, page ordering, missing page and wrong identity checks passed.')
