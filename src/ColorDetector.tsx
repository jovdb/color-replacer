import { Button } from "@material-ui/core";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import Slider from "@material-ui/core/Slider";
import Typography from "@material-ui/core/Typography";
import React from "react";
import { useState, withDebug, useCallback } from "./hooks/hooks";
import { pipe } from "./pipe";

function ColorDetector({
  onMinValueChange,
  onDetect,
}: {
  onMinValueChange?(value: number): void;
  onDetect?(): void;
}) {

  const [minValueRatio, setMinValueRatio] = useState<number>(10, "minValueRatio");

  const onValueChanged = useCallback(function onValueChanged(_, newValue) {
    setMinValueRatio(+newValue);
    if (onMinValueChange) onMinValueChange(+newValue);
  }, [onMinValueChange, setMinValueRatio]);

  return <Card>
    <CardHeader title="Color detection"/>
    <CardContent>
      <Typography color="textSecondary" gutterBottom>Minimum: {minValueRatio}%</Typography>
      <Slider
        value={minValueRatio}
        min={0}
        max={100}
        aria-labelledby="continuous-slider"
        valueLabelDisplay="auto"
        onChange={onValueChanged}/>
      {onDetect ? <Button variant="contained" onClick={onDetect}>
        Auto Detect
      </Button> : undefined}
    </CardContent>
  </Card>;
}

export default pipe(
  ColorDetector,
  withDebug(),
);
