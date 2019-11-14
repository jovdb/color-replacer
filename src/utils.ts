
export function fileToBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader  = new FileReader();

      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reader.onabort = () => reject(new Error(`Error reading image: ${file.name}`));
      try {
        reader.readAsDataURL(file); // reads the data as a URL
      } catch(e) {
        reject(e);
      }
    });
}

export function loadImageAsync(url: string, imgEl?: HTMLImageElement) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = imgEl || document.createElement("img");
      image.crossOrigin = "Anonymous";
      image.onload = () => resolve(image);
      image.onerror = image.onabort = () => reject(new Error("Error loading image"));
      image.src = url;
    });
}

export function save(data: any, filename: string) {

  if (typeof data === "object") {
      data = JSON.stringify(data, undefined, 2);
  }

  const blob = new Blob([data], {type: "text/json"});
  const e = document.createEvent("MouseEvents");
  const a = document.createElement("a");

  a.download = filename;
  a.href = window.URL.createObjectURL(blob);
  a.dataset.downloadurl =  ["text/json", a.download, a.href].join(":");
  e.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
  a.dispatchEvent(e);
}

export function exhaustiveFail(_value: never) {
  // throw new Error(`Unhandled value for variable '${name}': ${value}`);
}
