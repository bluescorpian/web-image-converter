export function canvasToBlob(canvas, filetype, quality) {
  return new Promise((res) => {
    canvas.toBlob((blob) => res(blob), 'image/' + (filetype === 'jpg' ? 'jpeg' : filetype), quality);
  });
}

export function saveBlob(filename, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
