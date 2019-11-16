import { useContext, useReducer } from "../hooks/hooks";
import React from "react";
import { box, log } from "../logger";
import { IHistogram } from "src/HistogramData";

declare global {

  type ImageLoadingState =  "loading" | "loaded" | "failed";

  interface IImageReducerActions {
    "LOAD_IMAGE": { type: "LOAD_IMAGE", name: string, url: string };
    "LOAD_IMAGE_SUCCES": { type: "LOAD_IMAGE_SUCCES", url: string, image: HTMLImageElement, histogram: IHistogram };
    "LOAD_IMAGE_ERROR": { type: "LOAD_IMAGE_ERROR", url: string };
    /*
    "INCREASE_ZOOM": { type: "INCREASE_ZOOM"};
    "DECREASE_ZOOM": { type: "DECREASE_ZOOM"};
    "SET_SCROLLPOSITION": { type: "SET_SCROLLPOSITION", scrollPosition: IScrollPosition};
    "SET_BACKGROUND": { type: "SET_BACKGROUND", background: string };
    "SET_EFFECT": { type: "SET_EFFECT", effectName: string };
    */
  }

  type IImageAction = IImageReducerActions[keyof IImageReducerActions];

  interface IImageState {
    readonly name: string | undefined;
    readonly url: string | undefined;
    readonly loadingState: ImageLoadingState | undefined;
    readonly image: HTMLImageElement | undefined;
    readonly histogram: IHistogram | undefined;
  }

  export interface IImageContext extends ReturnType<typeof useImageState> { }

}

const initialState: IImageState = {
  name: undefined,
  url: undefined,
  image: undefined,
  loadingState: undefined,
  histogram: undefined,
};

export const ImageContext = React.createContext<IImageContext>({} as any);

function getBox() {
  return box("useImageState", "#22f", "#fff");
}

export function useImageState() {
  return (useReducer as any)(imageReducer, initialState) as [IImageState, React.Dispatch<IImageAction>];
}

export function useImageContext() {
  const contextInfo = useContext(ImageContext);
  if (!contextInfo) throw new Error("No Image Context available, make sure a parent ImageProvider component is available");
  return contextInfo;
}

// Actions

function loadImageStart(state: IImageState, name: string, url: string) {
  return {
    ...state,
    loadingState: "loading",
    name,
    url,
  };
}

function loadImageSucces(state: IImageState, url: string, image: HTMLImageElement, histogram: IHistogram) {
  if (url !== state.url) return state; // prevent mismatch of url and image due to race conditions
  return {
    ...state,
    loadingState: "loaded",
    image,
    histogram,
  };
}

function loadImageError(state: IImageState, url: string) {
  if (url !== state.url) return state; // prevent mismatch of url and error due to race conditions
  return {
    ...state,
    loadingState: "error",
    image: undefined,
    histogram: undefined,
  };
}

// Reducer
function imageReducer(state: IImageState, action: IImageAction) {
  switch (action.type) {
    case "LOAD_IMAGE": return loadImageStart(state, action.name, action.url);
    case "LOAD_IMAGE_SUCCES": return loadImageSucces(state, action.url, action.image, action.histogram);
    case "LOAD_IMAGE_ERROR": return loadImageError(state, action.url);
    default:
      // exhaustiveFail(action.type);
      return state;
  }
}

export function loadImageAsync(url: string, { crossOrigin }: { crossOrigin?: string} = {}) {

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = document.createElement("img");

    function onload() {
      cleanup();
      resolve(img);
    }

    function onerror() {
        cleanup();
        reject(new Error("Error loading image"));
    }

    function cleanup() {
      img.removeEventListener("load", onload);
      img.removeEventListener("error", onerror);
      img.removeEventListener("abort", onerror);
    }

    img.addEventListener("load", onload);
    img.addEventListener("error", onerror);
    img.addEventListener("abort", onerror);
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.src = url;

  });
}
