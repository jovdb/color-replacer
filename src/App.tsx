import React, { useEffect } from "react";

import { FormControl, Grid, InputLabel, MenuItem, Select, Typography, Button } from "@material-ui/core";
import Colors from "./Colors";
import * as colorspaces from "./colorspaces";
import GroupConfig from "./GroupConfig";
import Histogram from "./Histogram";
import { useState, useCallback, withDebug } from "./hooks/hooks";
import { ImageSelector } from "./ImageSelector";
import { useGroupsContext, getSelectedGroup } from "./state/groups";
import Renderer from "./Renderer";
import "./style.css";
import { save } from "./utils";
import ZoomInIcon from "@material-ui/icons/ZoomIn";
import ZoomOutIcon from "@material-ui/icons/ZoomOut";
import { pipe } from "./pipe";
import { useRenderContext } from "./state/render";
import { useImageContext } from "./state/image";

const storage: any = {};
function setToStorage(key: string, value: string) {
  // Private mode
  try {
      localStorage.setItem(key, value);
  } catch (e) {
    storage[key] = value;
  }
}

function getFromStorage(key: string): string | null {
  // Private mode
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return storage[key] || null;
  }
}

function getColor(index: number) {
  return colorspaces.hslToRgb(index / 360.0, 1, 0.5).toHex();
}

function App() {

  const [selectedTabIndex, setSelectedTabIndex] = useState<number>(0, "selectedTabIndex");
  const [resultText, setResultText] = useState("", "resultText");

  const [groupsState, dispatchToGroups] = useGroupsContext();
  const [renderState, dispatchToRenderer] = useRenderContext();
  const [imageState] = useImageContext();

/*
  useEffect(() => {
    setHistogram(image ? histogramData.createHueHistogram(getImageData(image)) : undefined);
  }, [image]);*/

  const onEffectSelected = useCallback(function onEffectSelected(e: React.ChangeEvent<{ value: any }>) {
    const effectName = e.target.value;
    dispatchToRenderer({
      type: "SET_EFFECT",
      effectName,
    });
  }, [dispatchToRenderer]);

  const onSelectedTabIndexChanged = useCallback(function onSelectedTabIndexChanged(index) {
    setSelectedTabIndex(index);
  }, [setSelectedTabIndex]);

  const onBgSelected = useCallback(function onBgSelected(e: React.ChangeEvent<{ value: any }>) {
    dispatchToRenderer({
      type: "SET_BACKGROUND",
      background: e.target.value,
    });
  }, [dispatchToRenderer]);

  const onExport = useCallback(function onExport() {
    const json = {
      groups: groupsState.groups,
      image: imageState.name,
    };
    console.log(json);
    if (imageState.name) {
      setToStorage(imageState.name, JSON.stringify(json, undefined, 2));
      save(json, `export.json`);
    }
  }, [groupsState.groups, imageState.name]);

  useEffect(() => {
    if (!imageState.name) return;
    const result = getFromStorage(imageState.name);
    if (result) {
      const data = JSON.parse(result);
      dispatchToGroups({
        type: "REPLACE_GROUPS",
        groups: data.groups,
      });
    }
  }, [dispatchToGroups, imageState.name]);

  const onImageClicked = useCallback(function onImageClicked(pixelColor: string) {

    const hsl = colorspaces.hexToRgb(pixelColor).toHsl();

    const group: IGroup = {
      sourceColor: pixelColor,
      hue: Math.round(hsl.h * 360),
      hueMin: 0,
      hueMax: 359,
      lumMax: 0.95,
      lumMethod: "clip",
      lumMin: 0.05,
      satMax: 0.95,
      satMethod: "clip",
      satMin: 0.05,
    };

    if (hsl.l > 0.9) {
      // White
      group.lumMin = 0.95;
      group.lumMax = 1;
      group.satMin = 0;
      group.satMax = 1;
      group.satMethod = "clip";
      group.lumMethod = "clip";

    } else if (hsl.l < 0.1) {
      // Black
      group.lumMin = 0;
      group.lumMax = 0.05;
      group.satMin = 0;
      group.satMax = 1;
      group.satMethod = "clip";
      group.lumMethod = "clip";

    } else if (hsl.s < 0.2) {
      // Grey
      group.lumMin = 0.05;
      group.lumMax = 0.95;
      group.satMin = 0;
      group.satMax = 0.05;
      group.satMethod = "clip";
      group.lumMethod = "clip";

    } else {
      // color
      group.hueMin = group.hue - 10;
      group.hueMax = group.hue + 10;
      group.lumMin = 0.05;
      group.lumMax = 0.95;
      group.satMin = 0.05;
      group.satMax = 1;
    }

    dispatchToGroups({
      type: "ADD_GROUP",
      group,
    });
    setSelectedTabIndex(0);

  }, [dispatchToGroups, setSelectedTabIndex]);

  const onResultImageClicked = useCallback(function onResultImageClicked(rgbHex: string) {
    const rgb = colorspaces.hexToRgb(rgbHex);
    const hsl = rgb.toHsl();
    setResultText(`Color: ${rgbHex}, H: ${hsl.h.toFixed(3)}, S: ${hsl.s.toFixed(3)}, L: ${hsl.l.toFixed(3)}`);
  }, [setResultText]);

  const onSourceColorClick = useCallback(function onSourceColorClick() {
    setSelectedTabIndex(0);
  }, [setSelectedTabIndex]);

  const onTargetColorClick = useCallback(function onTargetColorClick() {
    setSelectedTabIndex(1);
  }, [setSelectedTabIndex]);

  const onZoomIn = useCallback(function onZoomIn() {
    dispatchToRenderer({
      type: "INCREASE_ZOOM",
    });
  }, [dispatchToRenderer]);

  const onZoomOut = useCallback(function onZoomOut() {
    dispatchToRenderer({
      type: "DECREASE_ZOOM",
    });
  }, [dispatchToRenderer]);

  const selectedGroupAtRender = getSelectedGroup(groupsState);
  const adjstedEffectName = renderState.effectName ? renderState.effectName // If an effect is selected, use it
    : selectedGroupAtRender && !selectedGroupAtRender.targetColor ? "matchingPixels"
    : "apply";

  return <div className="app">
  <Grid container spacing={3}>
    <Grid item xs={12} md={6}>
      <ImageSelector/>
    </Grid>
    <Grid item xs={12} md={6}>
    <Typography variant="body1" component="span" style={{marginRight: "1em"}}>Background color: </Typography>
      <Select value={renderState.background} onChange={onBgSelected}>
        <MenuItem value={"transparent"} key={""}>Transparent</MenuItem>)}
        <MenuItem value={"black"} key={"black"}>Black</MenuItem>)}
        <MenuItem value={"white"} key={"white"}>White</MenuItem>)}
        <MenuItem value={"magenta"} key={"magenta"}>Magenta</MenuItem>)}
      </Select>
      <Button size="small" onClick={onZoomIn}>
        <ZoomInIcon />
      </Button>
      <Button size="small" onClick={onZoomOut}>
        <ZoomOutIcon />
      </Button>&nbsp;
      <Typography variant="body1" component="span" style={{marginRight: "1em"}}>
        {Math.round(100 * renderState.zoomFactor)}%
      </Typography>
    </Grid>

    <Grid item xs={12} md={6}>

      <Renderer
        image={imageState.image}
        onClick={onImageClicked}
      ></Renderer>
      <br/><br/>

      <Histogram
        histogram={imageState.histogram}
        getColor={getColor}
        highlightGroup={groupsState.groups[groupsState.hoveredIndex] || selectedGroupAtRender}
      />
      <br/>

      <Colors
        onSourceClick={onSourceColorClick}
        onTargetClick={onTargetColorClick}
      />
      {!groupsState.groups || !groupsState.groups.length ? <Typography>Select the color to replace on the image</Typography> : undefined }

      {groupsState.selectedIndex >= 0
        ? <GroupConfig
          selectedTabIndex={selectedTabIndex}
          onSelectedTabIndexChanged={onSelectedTabIndexChanged}
          onExport={onExport}
        />
        : undefined
      }

    </Grid>

    <Grid item xs={12} md={6}>
      <Renderer
        image={imageState.image}
        effectName={adjstedEffectName}
        groups={groupsState.groups}
        selectedGroup={ selectedGroupAtRender }
        onClick={onResultImageClicked}
      />
      <div style={{fontFamily: "monospace"}}>{resultText}</div>
      <br/>
      <FormControl style={{width: "100%"}}>
        <InputLabel>Select effect</InputLabel>
        <Select value={renderState.effectName} onChange={onEffectSelected}>
          <MenuItem value={""} key={""}>Auto</MenuItem>)}
          {/*
          <MenuItem value={"red"} key={"red"}>Red</MenuItem>)}
          <MenuItem value={"green"} key={"green"}>Green</MenuItem>)}
          <MenuItem value={"blue"} key={"blue"}>Blue</MenuItem>)}
          */}
          <MenuItem value={"hue"} key={"hue"}>Hue</MenuItem>)}
          <MenuItem value={"saturation"} key={"saturation"}>Saturation (Dark = colorful)</MenuItem>)}
          <MenuItem value={"luminance"} key={"luminance"}>Luminance</MenuItem>)}
          <MenuItem value={"groups"} key={"groups"}>Selected Colors</MenuItem>)}
          <MenuItem value={"test"} key={"test"}>Test</MenuItem>)}
        </Select>
      </FormControl>
    </Grid>

  </Grid>

  </div>;
}

export default pipe(
  App,
  withDebug(),
);
