import { Typography } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import { makeStyles, Theme, withStyles  } from "@material-ui/core/styles";
import React from "react";
import { useState, withDebug, useCallback, useEffect } from "./hooks/hooks";
import { images } from "./images";
import { fileToBase64 } from "./utils";
import { pipe } from "./pipe";

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

  function ImageSelector({
    onImageChanged,
    imageEl,
  }: {

    /** Called when an image is selected */
    onImageChanged?: (url: string, name: string) => void;
    /** Load images in this element (Optional) */
    imageEl?: HTMLImageElement;
  }) {

    const imageIndex = 0;
    const [selectedImageIndex, setSelectedImageIndex] = useState(imageIndex, "selectedImageIndex");

    // Run once on first render
    useEffect(() => {
      const imageInfo = images[imageIndex];
      // if (onImageChanged) onImageChanged(imageInfo.url, imageInfo.name);
    }, []);

    const handleSelectChange = useCallback(function handleSelectChange(e: React.ChangeEvent<{ value: any }>) {
      const imageIndex2 = +e.target.value;
      const imageInfo = images[imageIndex2];

      setSelectedImageIndex(imageIndex);
      if (onImageChanged) onImageChanged(imageInfo.url, imageInfo.name);
    }, [onImageChanged, setSelectedImageIndex]);

    const handleFileSelect = useCallback(async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
      const file = (e as any).currentTarget.files[0] as File;
      if (!file) return;

      const base64 = await fileToBase64(file);
      setSelectedImageIndex(-1);
      if (onImageChanged) onImageChanged(base64, file.name);
    }, [onImageChanged, setSelectedImageIndex]);

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
