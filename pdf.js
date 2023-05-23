import { canvasToBlob } from './utility.js';

const pdfViewer = document.querySelector('.pdf-viewer');
const fileInput = document.querySelector('input[name="file-input"]');
const options = document.querySelector('.options');
const renderBtn = document.querySelector('input[name="render"]');
const progress = document.querySelector('.progress');

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.js';

fileInput.addEventListener('change', () => {
	toggleOptionsDisabled(!!fileInput.files.length);

	const file = fileInput.files[0];

	if (file) {
		const objectUrl = URL.createObjectURL(file);
		pdfViewer.src = objectUrl;
		URL.revokeObjectURL(objectUrl);
	} else {
		pdfViewer.src = '';
	}
});

function toggleOptionsDisabled(state) {
	const pdfOptionsInputs = options.querySelectorAll('input,select');
	if (state) {
		options.classList.remove('options-disabled');
		pdfOptionsInputs.forEach((i) => (i.disabled = false));
	} else {
		options.classList.add('options-disabled');
		pdfOptionsInputs.forEach((i) => (i.disabled = true));
	}
}
toggleOptionsDisabled(false);

renderBtn.addEventListener('click', async () => {
	const file = fileInput.files[0];
	if (!file) return;

	const pages = document.querySelector('input[name="pages"]').value || 'all';
	const quality = document.querySelector('input[name="quality"]').value / 10;
	const optimize = document.querySelector('input[name="optimize"]').checked;
	const filetype = document.querySelector('select[name="filetype"]').value;

	try {
		const renderedImages = await convertPdf(file, pages, filetype, quality, optimize);
	} catch (err) {
		alert('Failed to render pdf');
		console.error(err);
	}
});

async function convertPdf(file, pageRanges, filetype, quality, optimize) {
	const fileArrayBuffer = await fileToArrayBuffer(file);
	const pdf = await pdfjsLib.getDocument({ data: fileArrayBuffer }).promise;

	const pages = parsePageRanges(pageRanges, pdf.numPages);

	const renderedImages = [];

	for (let i = 0; i < pages.length; i++) {
		const pageIndex = pages[i];

		progress.textContent = `${pageIndex}/${pages.length}`;

		if (pageIndex > pdf.numPages) continue;

		const page = await pdf.getPage(pageIndex);

		const maxResolution = 1000;
		// if optimize then scale by 1, if one dimension still larger then maxResolition scale it down.
		let scale = optimize ? 1 : 2;
		let viewport = page.getViewport({ scale: scale });
		if (optimize && (viewport.height > maxResolution || viewport.width > maxResolution)) {
			viewport = page.getViewport({ scale: scale * (maxResolution / Math.max(viewport.height, viewport.width)) });
		}

		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		canvas.height = viewport.height;
		canvas.width = viewport.width;

		await page.render({
			canvasContext: context,
			viewport: viewport,
		}).promise;

		const convertedImage = await canvasToBlob(canvas, filetype, quality);

		const a = document.createElement('a');
		a.href = URL.createObjectURL(convertedImage);
		a.download = file.name.replace(/\.[^/.]+$/, '') + `[${pageIndex}]` + '.' + filetype;
		a.click();
	}

	return renderedImages;
}

function parsePageRanges(pageRanges, numPages) {
	let pages = [];
	if (pageRanges === 'all') pages = [...Array(numPages).keys()].map((i) => i + 1);
	else {
		pageRanges.split(',').forEach((range) => {
			const [startStr, endStr] = range.split('-');

			const start = parseInt(startStr);
			const end = parseInt(endStr);

			// if start NaN bad things, if end undefined its fine, but if not valid number bad things
			if (start === NaN || (end !== undefined && end === NaN)) return;

			if (!endStr) pages.push(start);
			else {
				for (let i = start; i <= end; i++) {
					pages.push(i);
				}
			}
		});
	}
	return pages;
}

function fileToArrayBuffer(file) {
	const fileReader = new FileReader();

	return new Promise((res) => {
		fileReader.onload = () => res(fileReader.result);
		fileReader.readAsArrayBuffer(file);
	});
}
