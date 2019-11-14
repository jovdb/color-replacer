export function getImageData(imageEl: HTMLImageElement, canvasEl?: HTMLCanvasElement ): ImageData {
    const canvas = canvasEl ? canvasEl : document.createElement("canvas");
    canvas.width = imageEl.width;
    canvas.height = imageEl.height;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(imageEl, 0, 0);
    console.log("ImageData loaded");
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
