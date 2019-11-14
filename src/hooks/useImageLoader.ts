import { useState, useEffect } from "./hooks";

interface IImageState {
  image: HTMLImageElement | undefined;
  status: "empty" | "loading" | "loaded" | "failed";
}

const defaultState: IImageState = { image: undefined, status: "empty" };

export function useImage(url: string | undefined, crossOrigin = false) {

  const [state, setState] = useState<IImageState>(defaultState, "image");
  const image = state.image;
  const status = state.status;

  useEffect(function useImage_Effect() {

    if (!url) {
      if (status !== "empty") {
        setState({ image: undefined, status: "empty" });
      }
      return;
    } else {
      setState({ image: undefined, status: "loading" });
    }

    const img = document.createElement("img");

    function onload() {
      setState({ image: img, status: "loaded" });
    }

    function onerror() {
      setState({ image: undefined, status: "failed" });
    }

    img.addEventListener("load", onload);
    img.addEventListener("error", onerror);
    img.addEventListener("abort", onerror);
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.src = url;

    return function cleanup() {
      img.removeEventListener("load", onload);
      img.removeEventListener("error", onerror);
      img.removeEventListener("abort", onerror);
      setState(defaultState);
    };
  }, [url, crossOrigin]);

  return [image, status] as const;
}

/*
export function useImageLoader(url: string | undefined, onLoad: (image: HTMLImageElement | undefined) => void, deps: any[] = []) {

  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined, "useImageLoader2.image");
  const [errorMessage, setErrorMessage] = useState<string>("", "useImageLoader2.errorMessage");
  const cachedOnLoad = useCallback(onLoad, deps);

  const imageLoaderSuccess = useCallback(function imageLoaderSuccess(e) {
    setImage(e.target);
    setErrorMessage("");
    if (cachedOnLoad) cachedOnLoad(e.target);
  }, [cachedOnLoad]);

  const imageLoaderFailed = useCallback(function imageLoaderFailed() {
    setImage(undefined);
    setErrorMessage("Failed to load image.");
    if (cachedOnLoad) cachedOnLoad(undefined);
  }, [cachedOnLoad]);

  useLayoutEffect(function addImageEventHandlers() { // synchroniously register events

    if (!url) {
      setImage(undefined);
      setErrorMessage("");
      if (cachedOnLoad) cachedOnLoad(undefined);
      return;
    }

    const newImage = document.createElement("img");
    newImage.addEventListener("load", imageLoaderSuccess);
    newImage.addEventListener("error", imageLoaderFailed);
    newImage.addEventListener("abort", imageLoaderFailed);

    newImage.src = url;

    function unsubscribeImageLoader() {
      newImage.removeEventListener("load", imageLoaderSuccess);
      newImage.removeEventListener("error", imageLoaderFailed);
      newImage.removeEventListener("abort", imageLoaderFailed);
    }

    return unsubscribeImageLoader;
  }, [url, cachedOnLoad, imageLoaderFailed, imageLoaderSuccess, setErrorMessage, setImage]);

  return [image, errorMessage] as const;
}*/
