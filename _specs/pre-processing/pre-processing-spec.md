# Pre-processing specification

This will be built using [upload-and-crop](../components/upload-and-crop.tsx) as a starting point.
There should be a menu on the left side that allows the user to select a shoot.
Images will be loaded on the right side in a grid.
- If there is a cropped image (prefix of 'c_' in the filename), it will be displayed, if not, the original (prefix of 'o_') will be displayed.

There will be a button at the bottom to 'remove background'.
- This will send the image to a background removal API (fal.ai)
- Images that have been processed should have a 'nobg_' prefix added to their filename.
example: `c_img_01.jpg` -> `nobg_c_img_01.jpg`
- Once the image is processed, it will be displayed in the grid in place of the original (or cropped, if it exists).
- There will be a save button, the save button will save images to the 'preprocessed' folder and to the 'preprocessed' image table.

