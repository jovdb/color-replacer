import { Typography } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import { makeStyles, Theme  } from "@material-ui/core/styles";
import React from "react";
import { useState, withDebug, useCallback } from "./hooks/hooks";
import { images } from "./images";
import { fileToBase64 } from "./utils";
import { pipe } from "./pipe";
import { useImageContext, loadImageAsync } from "./state/image";
import { createHueHistogram } from "./HistogramData";
import { getImageData } from "./imageData";
import { useGroupsContext } from "./state/groups";

const useStyles = makeStyles((theme: Theme) => ({
  button: {
    margin: theme.spacing(1),
  },
  input: {
    display: "none",
  },
  select: {
    width: "300px",
  },
}));

export const ImageSelector = pipe(

  function ImageSelector() {

    const imageIndex = 0;
    const [selectedImageIndex, setSelectedImageIndex] = useState(imageIndex, "selectedImageIndex");
    const [, dispatchToImage] = useImageContext();
    const [, dispatchToGroups] = useGroupsContext();

    const loadImage = useCallback(function loadImage(name: string, url: string) {
      dispatchToImage({
        type: "LOAD_IMAGE",
        name,
        url,
      });

      loadImageAsync(url, {crossOrigin: "anonymous"})
        .then((image) => dispatchToImage({
          type: "LOAD_IMAGE_SUCCES",
          url,
          image,
          histogram: createHueHistogram(getImageData(image)),
        }))
        .catch(() => dispatchToImage({
          type: "LOAD_IMAGE_ERROR",
          url,
        }));
    }, [dispatchToImage]);

    const handleSelectChange = useCallback(function handleSelectChange(e: React.ChangeEvent<{ value: any }>) {
      const imageIndex2 = +e.target.value;
      const {name, url} = images[imageIndex2];
      setSelectedImageIndex(imageIndex);
      dispatchToGroups({
        type: "REPLACE_GROUPS",
        groups: [],
      });
      loadImage(name, url);
    }, [dispatchToGroups, loadImage]);

    const handleFileSelect = useCallback(async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
      const file = (e as any).currentTarget.files[0] as File;
      if (!file) return;

      const base64 = await fileToBase64(file);
      setSelectedImageIndex(-1);
      dispatchToGroups({
        type: "REPLACE_GROUPS",
        groups: [],
      });
      loadImage(file.name, base64);
    }, [dispatchToGroups, loadImage]);

    const classes = useStyles();

    return <div>

        <Typography variant="body1" component="span" style={{marginRight: "1em"}}>Select image: </Typography>
        <Select value={selectedImageIndex} onChange={handleSelectChange} inputProps={{ id: "select-image" }}>
          {images.map((image, index) => <MenuItem value={index} key={index}>{image.name}</MenuItem>)}
        </Select>

      <input accept="image/*" className={classes.input} id="contained-button-file" type="file"
        onChange={handleFileSelect}
      />

      <label htmlFor="contained-button-file">
        <Button variant="contained" component="span" className={classes.button}>Use Local image</Button>
      </label>

    </div>;
  },
  withDebug(),
);
