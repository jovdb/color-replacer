import { Link, MenuItem, Tab, Tabs, Typography } from "@material-ui/core";
import { Box, Button, Card, Select, Slider } from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import SaveAltIcon from "@material-ui/icons/SaveAlt";
import React from "react";
import { withDebug, useCallback } from "./hooks/hooks";
import { useGroupsContext, getSelectedGroup, replaceGroup, deleteGroup } from "./state/groups";
import { pipe } from "./pipe";

function GroupConfig({
  selectedTabIndex,
  onSelectedTabIndexChanged,
  onExport,
}: {
  selectedTabIndex: number;
  onSelectedTabIndexChanged(index: number): void;
  onExport(): void;
}) {

  const maxHueDiff = 119;

  const [groupsState, setGroupsState] = useGroupsContext();
  const group = getSelectedGroup(groupsState);

  const {
    hueMin = 0,
    hueMax = 1,
    satMax = 0.95,
    satMin = 0.05,
    lumMax = 0.95,
    lumMin = 0.05,
    lumMethod = "clip",
    satMethod = "clip",
  } = group || {};

  const onHueRangeChanged = useCallback(function onHueRangeChanged(_, [newMinValue, newMaxValue]) {

    if (!group) return;

    if (newMinValue > 360) newMinValue = 360;
    if (newMaxValue < 0) newMaxValue = 0;

    const newGroup = {...group, hueMin: newMinValue, hueMax: newMaxValue};

    // Validate range
    if (newGroup.hue < newGroup.hueMin) newGroup.hue = newGroup.hueMin;
    if (newGroup.hue > newGroup.hueMax) newGroup.hue = newGroup.hueMax;
    if ((newGroup.hueMax - newGroup.hueMin) > 360) newGroup.hueMax = newGroup.hueMin + 360;
    setGroupsState((state) => replaceGroup(state, newGroup));
  }, [group, setGroupsState]);

  const onSatRangeChanged = useCallback(function onSatRangeChanged(_, [newMinValue, newMaxValue]) {
    if (!group || ((newMinValue === group.satMin) && (newMaxValue === group.satMax))) return;
    const newGroup = {...group, satMin: newMinValue / 100, satMax: newMaxValue / 100};
    setGroupsState((state) => replaceGroup(state, newGroup));
  }, [group, setGroupsState]);

  const onLumRangeChanged = useCallback(function onLumRangeChanged(_, [newMinValue, newMaxValue]) {
    if (!group) return;
    const newGroup = {...group, lumMin: newMinValue / 100, lumMax: newMaxValue / 100 };
    setGroupsState((state) => replaceGroup(state, newGroup));
  }, [group, setGroupsState]);

  const onSatMethodChanged = useCallback(function onSatMethodChanged(e) {
    if (!group) return;
    const value = e.target.value;
    const newGroup = {...group, satMethod: value};
    setGroupsState((state) => replaceGroup(state, newGroup));
  }, [group, setGroupsState]);

  const onLumMethodChanged = useCallback(function onLumMethodChanged(e) {
    if (!group) return;
    const value = e.target.value;
    const newGroup = {...group, lumMethod: value};
    setGroupsState((state) => replaceGroup(state, newGroup));
  }, [group, setGroupsState]);

  const onExportClicked = useCallback(function onExportClicked(e) {
    if (onExport) onExport();
  }, [onExport]);

  const onDeleteClicked = useCallback(function onDeleteClicked() {
    setGroupsState((state) => deleteGroup(state));
  }, [setGroupsState]);

  const onTabClicked = useCallback(function onTabClicked(_, index) {
    if (onSelectedTabIndexChanged) {
      onSelectedTabIndexChanged(index);
    }
  }, [onSelectedTabIndexChanged]);

  return <Card>
    <Tabs aria-label="simple tabs" value={selectedTabIndex} onChange={onTabClicked}>
      <Tab label="Source"/>
      <Tab label="Target"/>
      <Button
        size="small"
        onClick={onDeleteClicked}
        disabled={!group}>
        <DeleteIcon />
      </Button>
      <Button
        disabled={!group}
        onClick={onExportClicked}>
        <SaveAltIcon />
      </Button>
    </Tabs>
    <Box
      hidden={selectedTabIndex !== 0}
      margin={2}
      >

      <Typography variant="body1" >Hue range: {hueMin}° - {hueMax}°</Typography>
      <Slider
        disabled={!group}
        value={[hueMin, hueMax]}
        min={0 - maxHueDiff}
        max={360 + maxHueDiff}
        aria-labelledby="range-slider"
        valueLabelDisplay="auto"
        onChange={onHueRangeChanged}/>

      <Typography variant="body1" >Saturation range: {Math.round(satMin * 100)}% - {Math.round(satMax * 100)}%</Typography>
      <Slider
        disabled={!group}
        value={[Math.round(satMin * 100), Math.round(satMax * 100)]}
        min={0}
        max={100}
        aria-labelledby="range-slider"
        valueLabelDisplay="auto"
        getAriaValueText={(v) => `${v}%`}
        onChange={onSatRangeChanged}/>

      <Typography variant="body1" >Luminance range: {Math.round(lumMin * 100)}% - {Math.round(lumMax * 100)}%</Typography>
      <Slider
        disabled={!group}
        value={[Math.round(lumMin * 100), Math.round(lumMax * 100)]}
        min={0}
        max={100}
        aria-labelledby="range-slider"
        valueLabelDisplay="auto"
        getAriaValueText={(v) => `${v}%`}
        onChange={onLumRangeChanged}/>

    </Box>
    <Box
      hidden={selectedTabIndex !== 1}
      margin={2}>
      <table>
        <tr>
          <td><Typography variant="body1" component="span" style={{marginRight: "1em", width: "200px"}}>Saturation mixing: </Typography></td>
          <td><Select value={satMethod} style={{ minWidth: "200px"}} onChange={onSatMethodChanged}>
          <MenuItem value={"fixed"}>Fixed from target color</MenuItem>)}
          <MenuItem value={"clip"} >Clip</MenuItem>)}
          <MenuItem value={"linear"} >Linear</MenuItem>)}
        </Select></td>
        <td><Typography variant="body1" component="span" style={{marginLeft: "1em"}}><Link href="https://stackblitz.com/edit/typescript-anneor" target="info">Sample...</Link></Typography></td>
        </tr>
        <tr>
          <td><Typography variant="body1" component="span" style={{marginRight: "1em"}}>Luminance mixing: </Typography></td>
          <td><Select value={lumMethod} style={{ minWidth: "200px"}} onChange={onLumMethodChanged}>
          <MenuItem value={"fixed"}>Fixed from target color</MenuItem>)}
          <MenuItem value={"clip"} >Clip</MenuItem>)}
          <MenuItem value={"linear"} >Linear</MenuItem>)}
        </Select></td>
        </tr>
      </table>
    </Box>
  </Card>;
}

export default pipe(
  GroupConfig,
  withDebug(),
);
