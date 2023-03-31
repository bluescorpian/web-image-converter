export function canvasToBlob(canvas, filetype, quality) {
  return new Promise((res) => {
    canvas.toBlob((blob) => res(blob), 'image/' + (filetype === 'jpg' ? 'jpeg' : filetype), quality);
  });
}
