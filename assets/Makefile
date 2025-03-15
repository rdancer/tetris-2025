# Set the source and output file
SRC = preview_white.svg
TEMP = preview_white.png
OUT = preview_white_8bit.png

# Default target
all: $(OUT)

# Convert SVG to PNG using Inkscape
$(TEMP): $(SRC)
	inkscape -z -e $(TEMP) -w 1200 -h 630 $(SRC)

# Convert PNG to 8-bit using ImageMagick
$(OUT): $(TEMP)
	convert $(TEMP) -depth 8 $(OUT)

# Clean intermediate files
clean:
	rm -f $(TEMP) $(OUT)
