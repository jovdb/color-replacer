import React from "react";
import * as colorspaces from "./colorspaces";
import { onlyColorValue } from "./effects/onlyColorValue";
import { onlyHue, onlyLuminance, onlySaturation } from "./effects/onlyHslValue";
import { useRef, withDebug, useLayoutEffect, useCallback, useEffect } from "./hooks/hooks";
import { pipe } from "./pipe";
import { useRenderContext } from "./state/render";
import { useSpring, animated } from "react-spring";

function filerGroup(imageData: ImageData, i: number, group: IGroup) {

  const hsl = colorspaces.rgbToHsl(imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]);

  const h = hsl.h * 360;
  const hueMin = (group.hueMin + 360) % 360;
  const hueMax = (group.hueMax + 360) % 360;

  const hueOk = hueMin > hueMax // 350 -> 10
    ? h >= hueMin || h <= hueMax
    : h >= hueMin && h <= hueMax;

  if (
    hueOk &&
    (hsl.s >= group.satMin && hsl.s <= group.satMax) &&
    (hsl.l >= group.lumMin && hsl.l <= group.lumMax)
  ) return hsl;

  return undefined;
}

 // Quadratic
const calcControlPoint = (target = 0.5, source = 0.5) => (target - source * source) / (2 * source * (1 - source));
const calcBezier = (p1: number, source = 0.5) => Math.min(1, Math.max(0, (2 * (1 - source) * source * p1 + source ** 2)));
const calcLinear = (target: number, from = 0.5, to = 0.5) => {

  // Prevent division by zero
  if (from === 1) { return 1; }

  if (target < from) {
    const factor = to / from;
    return target * factor;
  } else {
    const factor = (1 - to) / (1 - from);
    return to + (target - from) * factor;
  }
};

const applyEffect = (imageData: ImageData, effectName: string | undefined, groups: ReadonlyArray<IGroup> | undefined, selectedGroup: IGroup | undefined) => {

  if (!imageData) return;

  switch(effectName) {

    case "matchingPixels": {

      // Configuring Source
      if (!selectedGroup) return;

      const len = imageData.data.length;
      let hsl;
      for (let i = 0; i < len; i += 4) {
        hsl = filerGroup(imageData, i, selectedGroup);
        if (!hsl) imageData.data[i + 3] = 0; // Remove color -> transparent
      }
      break;
    }

    case "apply": {
      if (!groups) return;
      const len = imageData.data.length;
      console.log(`Rendering... (${imageData.width}x${imageData.height})`);
      let pixelHsl;
      const groupsWithTargetColor = groups.filter((g) => g.targetColor) as ReadonlyArray<IGroup & Required<Pick<IGroup, "targetColor">>>;

      const targetHsls = groupsWithTargetColor.map((group) => colorspaces.hexToRgb(group.targetColor).toHsl());
      const sourceHsls = groupsWithTargetColor.map((group) => colorspaces.hexToRgb(group.sourceColor!).toHsl());

      for (let i = 0; i < len; i += 4) {

        for (let groupIndex = 0; groupIndex < groupsWithTargetColor.length; groupIndex++) {

          const group = groupsWithTargetColor[groupIndex];
          const targetHsl = targetHsls[groupIndex];
          const sourceHsl = sourceHsls[groupIndex];

          pixelHsl = filerGroup(imageData, i, group);

          if (pixelHsl) {

            // Hue
            const h = targetHsl.h;

            // Saturation
            let s = pixelHsl.s;
            switch (group.satMethod) {
              case "fixed":
                s = targetHsl.s;
                break;

              case "clip": {
                s = Math.max(0, Math.min(1, targetHsl.s + pixelHsl.s - sourceHsl.s));
                break;
              }

              case "linear": {

                const ratio = targetHsl.s / sourceHsl.s;
                s = pixelHsl.s * ratio;
                break;
              }

              case "curve": {
                const satControlPoint = calcControlPoint(targetHsl.s, sourceHsl.s);
                s = calcBezier(satControlPoint, pixelHsl.s);
                break;
              }
            }

            // Luminance
            let l = pixelHsl.l;
            switch (group.lumMethod) {
              case "fixed":
                l = targetHsl.l;
                break;

              case "clip": {
                l = Math.max(0, Math.min(1, targetHsl.l + pixelHsl.l - sourceHsl.l));
                break;
              }

              case "linear": {
                l = calcLinear(pixelHsl.l, sourceHsl.l, targetHsl.l);
                break;
              }

              case "curve": {
                const lumControlPoint = calcControlPoint(targetHsl.l, sourceHsl.l);
                l = calcBezier(lumControlPoint, pixelHsl.l);
                break;
              }
            }

            colorspaces.hslToRgb(h, s, l).toImageData(imageData, i);

            break; // first matching group wins
          }
        }
      }

      console.log("Rendered");
      break;
    }

    case "red": {
      const len = imageData.data.length;
      for (let i = 0; i < len; i += 4) {
        const pixelRgb = colorspaces.imageDataToRgb(imageData, i);
        const pixelHsl = pixelRgb.toHsl();

        const h = 0; // red
        const s = 1;

        const getHue = 120; // green
        const r = Math.max(0, 120 - ((pixelHsl.h - getHue)% 360)) / 120;
        // const l = 1 - (r * pixelHsl.s * (1 - Math.abs((pixelHsl.l - 0.5) * 2))) / 2;
        const l = 1 - (r / 2);
        colorspaces.hslToRgb(h, s, l).toImageData(imageData, i);
      }
      break;
    }

    case "test": {

      const targetColor1 = colorspaces.hexToRgb("#FFFF00"); // Red -> Yellow
      const targetColor2 = colorspaces.hexToRgb("#FF0000"); // Green -> Red
      const targetColor3 = colorspaces.hexToRgb("#008800"); // Blue -> Dark green

      const len = imageData.data.length;
      for (let i = 0; i < len; i += 4) {
        const pixelRgb = colorspaces.imageDataToRgb(imageData, i);
        const pixelHsl = pixelRgb.toHsl();

        if (pixelHsl.l > 0.9 || pixelHsl.l < 0.1) continue;

        // const colorParts = getParts(pixelHsl.h * 360);
        const colorParts = colorspaces.hslToRgb(pixelHsl.h, 1, 0.5); // color parts without saturation/luminance
        colorParts.r /= 255;
        colorParts.g /= 255;
        colorParts.b /= 255;

        const r = (targetColor1.r * colorParts.r + targetColor2.r * colorParts.g + targetColor3.r * colorParts.b) / 3;
        const g = (targetColor1.g * colorParts.r + targetColor2.g * colorParts.g + targetColor3.g * colorParts.b) / 3;
        const b = (targetColor1.b * colorParts.r + targetColor2.b * colorParts.g + targetColor3.b * colorParts.b) / 3;

        const targetHsl = colorspaces.rgbToHsl(r, g, b);
        // const targetHsl = mixed.toHsl();

        targetHsl.s = (targetColor1.toHsl().s + targetColor2.toHsl().s + targetColor3.toHsl().s ) / 3 ;

        // For mixed colors don't use luminace (mixing color changes luminance)
        // if (pixelHsl.l > 0.1 && pixelHsl.l < 0.9) {
        const color = pixelHsl.h * 360 % 120; // not mixed means multiple of 120°
        const margin = 3;
        if (color < margin || color > (120 - margin)) { // 5 hues marge
          targetHsl.l = pixelHsl.l;
        } else {
          targetHsl.l = 0.5; // mixed source colors
        }
        // }

/*
        const targetHsl = colorspaces.rgbToHsl(255, 0, 0);
        targetHsl.s = 1;
        targetHsl.l = 0.5;*/
        targetHsl.toRgb().toImageData(imageData, i);
        // imageData.data[i + 3] = colorParts.r * 255;
      }
      break;
    }

    case "red2": {
      onlyColorValue(imageData, { color: "r"});
      break;
    }
    case "green": {
      onlyColorValue(imageData, { color: "g"});
      break;
    }
    case "blue": {
      onlyColorValue(imageData, { color: "b"});
      break;
    }
    case "hue": {
      onlyHue(imageData, 0.2);
      break;
    }
    case "groups": {
      if (!groups) return;
      const len = imageData.data.length;
      let hsl;
      let found = false;
      for (let i = 0; i < len; i += 4) {
        found = false;
        for (const group of groups) {
          hsl = filerGroup(imageData, i, group);
          if (hsl) {
            // TODO: Source color;
            const h = group.hue / 360;
            const s = 1;
            const l = 0.5;
            colorspaces.hslToRgb(h, s, l).toImageData(imageData, i);
            found = true;
            break; // first macthing group wins
          }
        }
        if (!found) imageData.data[i + 3] = 0; // Remove color -> transparent
      }
      break;
    }
    case "saturation": {
      onlySaturation(imageData);
      break;
    }
    case "luminance": {
      onlyLuminance(imageData);
      break;
    }
  }
};

function getPointerPosition(canvasEl: HTMLCanvasElement, e: MouseEvent, offset: {x: number; y: number; } | undefined) {

  const size = canvasEl.getBoundingClientRect();
  const x = (e.pageX - canvasEl.offsetLeft + (offset ? offset.x : 0)) / size.width * canvasEl.width;
  const y = (e.pageY - canvasEl.offsetTop + (offset ? offset.y : 0)) / size.height * canvasEl.height;
  return {x, y};
}

function Renderer(options: {
  image?: HTMLImageElement;
  effectName?: string;
  groups?: ReadonlyArray<Readonly<IGroup>>;
  selectedGroup?: IGroup;
  onClick?(color: string): void;
}) {
  const {image = null, effectName, onClick, groups, selectedGroup} = options;

  const canvasRef = useRef<HTMLCanvasElement>(null, "Renderer.canvasRef");
  const ctxRef = useRef<CanvasRenderingContext2D>(null, "Renderer.ctxRef");
  const rootRef = useRef<HTMLDivElement>(null, "Renderer.rootRef");
  const [renderState, dispatchToRenderer] = useRenderContext();
  const {background, scrollPosition, zoomFactor } = renderState;
  const canvasZoom = useSpring({ transform: `scale(${zoomFactor})` });
  const canvasEl = canvasRef.current;

  // Create context once
  if (canvasEl && !ctxRef.current) {
    const ctx2 = canvasEl.getContext("2d")!;
    (ctx2 as any).imageSmoothingEnabled = false;
    (ctxRef as any).current = ctx2;
  }

  useEffect(function drawImageOnCanvas() {
    const ctx = ctxRef.current!;
    if (canvasEl && image && ctx) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(-1, -1, canvasEl.width + 1, canvasEl.height + 1);

      const width = canvasEl.width = image.width;
      const height = canvasEl.height = image.height;
      ctx.drawImage(image, 0, 0, image.width, image.height);

      if (effectName) {
        const newImageData = ctx.getImageData(0, 0, width, height);
        applyEffect(newImageData, options.effectName, options.groups, options.selectedGroup);
        ctx.putImageData(newImageData, 0, 0);
       }
    }
  }, [image, effectName, onClick, groups, selectedGroup, ctxRef, canvasEl, options.effectName, options.groups, options.selectedGroup]);

  // Update scroll position
  useLayoutEffect(function updateScrollPosition() {
    if (rootRef && rootRef.current && scrollPosition) {
      rootRef.current.scrollLeft = scrollPosition.x;
      rootRef.current.scrollTop = scrollPosition.y;
    }
  }, [scrollPosition]);

  const onCanvasClick = useCallback(function onCanvasClick(e: any) {

    if (!canvasRef.current || !ctxRef.current) return;
    const {x, y} = getPointerPosition(canvasRef.current, e, scrollPosition);
    const imageData = ctxRef.current.getImageData(x, y, 1, 1);
    const rgb = colorspaces.imageDataToRgb(imageData, 0);

    /*
    // Draw cross on location clicked (disabled for zoom)
    ctxRef.current.moveTo(x - 5, y);
    ctxRef.current.lineTo(x + 5, y);
    ctxRef.current.moveTo(x, y - 5);
    ctxRef.current.lineTo(x, y + 5);
    ctxRef.current.strokeStyle = "blue";
    ctxRef.current.stroke();
    */

    if (onClick) onClick(rgb.toHex());

  }, [canvasRef, ctxRef, onClick, scrollPosition]);

  const onScrolled = useCallback(function onScrolled(e: any) {
    dispatchToRenderer({
      type: "SET_SCROLLPOSITION",
      scrollPosition: {x: e.target.scrollLeft, y: e.target.scrollTop },
    });
  }, [dispatchToRenderer]);

  const bgStyle = background === "transparent" ? `url("data:image/gif;base64,R0lGODdhEAAQAPAAAMjIyP///ywAAAAAEAAQAAACH4RvoauIzNyBSyYaLMDZcv15HAaSIlWiJ5Sya/RWVgEAOw==")` : background;

  return <div className="renderer" onScroll={onScrolled} ref={rootRef} style={{background: bgStyle}}>
    <animated.canvas ref={canvasRef} onClick={onCanvasClick} style={canvasZoom}></animated.canvas>
  </div>;
}

export default pipe(
  Renderer,
  withDebug(),
);
