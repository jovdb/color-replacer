import Card from "@material-ui/core/Card";
import React, { useEffect } from "react";
import * as colorspaces from "./colorspaces";
import "./Histogram.css";
import { IHistogram, ISample } from "./HistogramData";
import { useRef, withDebug } from "./hooks/hooks";
import { pipe } from "./pipe";

function Histogram({
  histogram,
  getColor = () => "#000000",
  highlightGroup,
  minNumberOfPixels,
}: {
  histogram?: IHistogram;
  getColor?: (index: number, sample: ISample) => string;
  highlightGroup?: IGroup;
  minNumberOfPixels?: number;
}) {

  const canvasRef = useRef<HTMLCanvasElement>(null, "canvasRef");
  const ctxRef = useRef<CanvasRenderingContext2D>(null, "ctxRef");

  useEffect(function drawHistogram() {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    // Create context once
    if (!ctxRef.current) {
      (ctxRef as any).current = canvasEl.getContext("2d");
    }

    // Draw histogram
    const width = canvasEl.width;
    const height = canvasEl.height;
    const ctx = ctxRef.current!;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(-10, -10, width + 10, height + 10);

    if (!histogram) return;
    // const { minNumberOfPixels, highlightRange } = options;

    // Draw Histogram
    ctx.save();
    const xScale = width / histogram.nbrOfSamples;
    const yScale = height / histogram.maxSampleValue;
    const xOffset = 0.5; // prevent antialiasing
    const yOffset = height;

    ctx.setTransform(xScale, 0, 0, -yScale, xOffset, yOffset);

    // Draw group
    if (highlightGroup) {

      /* dark background for active */
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = "#E0E0E0";
      ctx.fillRect(highlightGroup.hueMin, 0, highlightGroup.hueMax - highlightGroup.hueMin + 1, histogram.maxSampleValue);

      // hue line
      ctx.moveTo(highlightGroup.hue, 0);
      ctx.lineTo(highlightGroup.hue, histogram.maxSampleValue);
      ctx.strokeStyle = "#A0A0A0";
      ctx.stroke();

      if (highlightGroup.hueMin < 0) ctx.fillRect(360 + highlightGroup.hueMin, 0, -highlightGroup.hueMin, histogram.maxSampleValue);
      if (highlightGroup.hueMax > 360) ctx.fillRect(0, 0, highlightGroup.hueMax - 360, histogram.maxSampleValue);
      ctx.restore();

    }

    for (const i of Object.keys(histogram.samples)) {
      const index = +i;
      const sample = histogram.samples[index];
      if (!sample) continue;
      const count = sample.value;

      ctx.beginPath();
      ctx.moveTo(index, 0);
      ctx.lineTo(index, count);
      ctx.closePath();

      let color = getColor(index, sample);
      if (highlightGroup && ((index < highlightGroup.hueMin) || (index > highlightGroup.hueMax))) {
        const hsl = colorspaces.hexToRgb(getColor(index, sample)).toHsl();
        hsl.l *=  1.5;
        color = hsl.toRgb().toHex();
      }
      ctx.strokeStyle = color;
      ctx.stroke();
    }

    // Draw minimum line
    if (minNumberOfPixels) {
      ctx.moveTo(0, minNumberOfPixels);
      ctx.lineTo(360, minNumberOfPixels);
      ctx.setLineDash([1, 2]);
      ctx.strokeStyle = "red";
      ctx.stroke();
    }

    ctx.restore();
  },[histogram, highlightGroup, getColor, minNumberOfPixels, canvasRef, ctxRef]);

  return <Card className="histogram-card">
    <canvas className="histogram" ref={canvasRef}></canvas>
    <div className="histogram-ar"></div>
  </Card>;

}

export default pipe(
  Histogram,
  withDebug(),
);
