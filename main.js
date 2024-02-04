import { openSimplexNoise } from "./libs/simplex-noise.js";

const canvas = document.getElementById("map-canvas");
const ctx = canvas.getContext("2d");
canvas.width = 1280;
canvas.height = 1680;

const width = 1200;
const height = 1600;
const borderOffset = 80;

document.addEventListener("DOMContentLoaded", () => {
    function fractalNoise(simplex, x, y, octaves, persistence, scale) {
        let total = 0;
        let frequency = scale;
        let amplitude = 1;
        let maxValue = 0;
        for (let i = 0; i < octaves; i++) {
            total += simplex(x * frequency, y * frequency) * amplitude;

            maxValue += amplitude;

            amplitude *= persistence;
            frequency *= 2;
        }

        return total / maxValue;
    }

    function marchingSquares(data, threshold) {
        const contours = [];
        for (let x = borderOffset; x < width - 1; x++) {
            for (let y = borderOffset; y < height - 1; y++) {
                const squareIndex = getSquareIndex(x, y, threshold, data);
                const edges = lookupTable[squareIndex];
                if (edges.length > 0) {
                    contours.push(...traceEdges(x, y, edges));
                }
            }
        }
        return contours;
    }

    function getSquareIndex(x, y, threshold, data) {
        let index = 0;
        if (data[x][y] < threshold) index |= 1;
        if (data[x + 1][y] < threshold) index |= 2;
        if (data[x + 1][y + 1] < threshold) index |= 4;
        if (data[x][y + 1] < threshold) index |= 8;
        return index;
    }

    const lookupTable = [
        [],
        ["bottomLeft", "left"],
        ["bottomRight", "bottom"],
        ["left", "bottom"],
        ["topLeft", "top"],
        ["topRight", "top"],
        ["right", "top"],
        ["bottom", "left"],
        ["bottom", "right"],
        ["left", "top"],
        ["right", "bottom"],
        ["top", "left"],
        ["top", "right"],
        ["bottom", "center"],
        ["top", "center"],
        ["left", "center"],
        ["right", "center"],
    ];

    function traceEdges(x, y, edges) {
        const tracedEdges = [];
        for (let i = 0; i < edges.length; i += 2) {
            const edgeStart = edges[i];
            const edgeEnd = edges[i + 1];

            //TODO: use linear interp instead of midpoint
            const point1 = getEdgeMidpoint(x, y, edgeStart);
            const point2 = getEdgeMidpoint(x, y, edgeEnd);
            tracedEdges.push([point1, point2]);
        }
        return tracedEdges;
    }

    function getEdgeMidpoint(x, y, edge) {
        switch (edge) {
            case "left":
                return { x: x, y: y + 0.5 };
            case "bottom":
                return { x: x + 0.5, y: y + 1 };
            case "right":
                return { x: x + 1, y: y + 0.5 };
            case "top":
                return { x: x + 0.5, y: y - 0.5 };
            case "topLeft":
                return { x: x - 0.5, y: y - 0.5 };
            case "topRight":
                return { x: x + 0.5, y: y - 0.5 };
            case "bottomLeft":
                return { x: x - 0.5, y: y + 0.5 };
            case "bottomRight":
                return { x: x + 0.5, y: y + 0.5 };
            case "center":
                return { x: x, y: y };
            default:
                throw new Error(`Unknown edge type: ${edge}`);
        }
    }

    function drawContours(contours) {
        contours.forEach((edge) => {
            ctx.beginPath();
            ctx.moveTo(edge[0].x, edge[0].y);
            ctx.lineTo(edge[1].x, edge[1].y);
            ctx.stroke();
        });
    }

    function generateNoiseGrid(
        simplex,
        width,
        height,
        octaves,
        persistence,
        scale,
    ) {
        let grid = new Array(width);
        for (let i = 0; i < width; i++) {
            grid[i] = new Array(height);
            for (let j = 0; j < height; j++) {
                grid[i][j] = fractalNoise(
                    simplex,
                    i / 100,
                    j / 100,
                    octaves,
                    persistence,
                    scale,
                );
            }
        }
        return grid;
    }

    function drawMap(simplex, scale, octaves, persistence, threshold) {
        const noiseGrid = generateNoiseGrid(
            simplex,
            width,
            height,
            octaves,
            persistence,
            scale,
        );
        const contours = marchingSquares(noiseGrid, threshold);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "rgb(259, 254, 254)";
        ctx.lineWidth = 2;
        contours.forEach(([start, end]) => {
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        });
    }

    function drawGrids(ctx, width, height, numRows, numCols) {
        ctx.save();

        ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
        ctx.lineWidth = 1;

        const rowSpacing = height / numRows;
        const colSpacing = width / numCols;

        for (let i = 1; i < numRows; i++) {
            ctx.beginPath();
            ctx.moveTo(borderOffset, i * rowSpacing);
            ctx.lineTo(width - borderOffset, i * rowSpacing);
            ctx.stroke();
        }

        for (let i = 1; i < numCols; i++) {
            ctx.beginPath();
            ctx.moveTo(i * colSpacing, borderOffset);
            ctx.lineTo(i * colSpacing, height - borderOffset);
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawBorder(
        ctx,
        canvasWidth,
        canvasHeight,
        cellWidth,
        cellHeight,
        rows,
        cols,
    ) {
        ctx.save();

        ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
        ctx.lineWidth = 1;
        ctx.setLineDash([10, 5, 5, 5]);
        const startSide = Math.floor(Math.random() * 4);
        let endSide = Math.floor(Math.random() * 3);
        if (endSide == startSide) endSide += 1;

        let startX, startY, endX, endY;
        switch (startSide) {
            case 0:
                startX = Math.random() * canvasWidth - borderOffset;
                startY = borderOffset;
                break;
            case 1:
                startX = canvasWidth - borderOffset;
                startY = Math.random() * canvasHeight - borderOffset;
                break;
            case 2:
                startX = Math.random() * canvasWidth - borderOffset;
                startY = canvasHeight - borderOffset;
                break;
            case 3:
                startX = borderOffset;
                startY = Math.random() * canvasHeight - borderOffset;
                break;
        }

        switch (endSide) {
            case 0:
                endX = Math.random() * canvasWidth - borderOffset;
                endY = borderOffset;
                break;
            case 1:
                endX = canvasWidth - borderOffset;
                endY = Math.random() * canvasHeight - borderOffset;
                break;
            case 2:
                endX = Math.random() * canvasWidth - borderOffset;
                endY = canvasHeight - borderOffset;
                break;
            case 3:
                endX = borderOffset;
                endY = Math.random() * canvasHeight - borderOffset;
                break;
        }

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.restore();
    }

    function drawCrossMarks(ctx, width, height, numRows, numCols) {
        const rowSpacing = height / numRows;
        const colSpacing = width / numCols;
        ctx.save();

        ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";

        for (let i = 3; i < numRows; i += 5) {
            for (let j = 2; j < numCols; j += 4) {
                const x = j * colSpacing + 15;
                const y = i * rowSpacing + 15;
                ctx.beginPath();
                ctx.moveTo(x - 7, y);
                ctx.lineTo(x + 7, y);
                ctx.moveTo(x, y - 7);
                ctx.lineTo(x, y + 7);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    const rows = 14;
    const cols = 10;
    const cellHeight = canvas.height / rows;
    const cellWidth = canvas.width / cols;

    function drawMapBorder(ctx, width, height) {
        ctx.save();

        ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
        ctx.beginPath();
        ctx.moveTo(borderOffset, borderOffset);
        ctx.lineTo(borderOffset, height);
        ctx.lineTo(width, height);
        ctx.lineTo(width, borderOffset);
        ctx.lineTo(borderOffset, borderOffset);
        ctx.stroke();

        ctx.restore();
    }

    function fillMapBorder(ctx, width, height) {
        ctx.save();

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, borderOffset);
        ctx.fillRect(0, height, width + borderOffset, borderOffset);
        ctx.fillRect(0, 0, borderOffset, height);
        ctx.fillRect(width, 0, borderOffset, height);

        ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(canvas.width, 0);
        ctx.lineTo(0, 0);
        ctx.lineTo(0, canvas.height);
        ctx.stroke();

        ctx.restore();
    }

    function formatCoordinate(value, isLongitude) {
        const direction = isLongitude
            ? value >= 0
                ? "E"
                : "W"
            : value >= 0
            ? "N"
            : "S";
        return Math.abs(value).toFixed(2) + "° " + direction;
    }

    function getRandomCoordinates(numLabels, min, max, isLongitude) {
        const step = (max - min) / numLabels;
        let coordinates = [];
        for (let i = 0; i <= numLabels; i++) {
            let randomCoord = min + step * i + Math.random() * step;
            randomCoord = parseFloat(randomCoord.toFixed(2));
            if (isLongitude) {
                randomCoord =
                    randomCoord > 180 ? randomCoord - 360 : randomCoord;
            } else {
                randomCoord =
                    randomCoord > 90 ? 180 - randomCoord : randomCoord;
            }
            coordinates.push(formatCoordinate(randomCoord, isLongitude));
        }
        return coordinates;
    }

    function drawBorderLabels(
        context,
        width,
        height,
        numLabelsX,
        numLabelsY,
        startLat,
        startLong,
        latIncrement,
        longIncrement,
    ) {
        context.save();
        context.font = "12px Arial";
        context.fillStyle = "rgb(172, 172, 172)";
        context.textBaseline = "middle";

        const padding = 60;

        const centerLat = Math.random() * 180 - 90;
        const centerLong = Math.random() * 360 - 180;

        const latRange = 10;
        const longRange = 20;

        const latLabels = getRandomCoordinates(
            numLabelsY,
            centerLat - latRange / 2,
            centerLat + latRange / 2,
            false,
        );
        const longLabels = getRandomCoordinates(
            numLabelsX,
            centerLong - longRange / 2,
            centerLong + longRange / 2,
            true,
        );

        for (let i = 1; i <= numLabelsX - 1; i++) {
            let x = (i * width) / numLabelsX;
            let longLabel = longLabels[i];

            x = i === 0 ? x + padding : i === numLabelsX ? x - padding : x;

            context.textAlign =
                i === 0 ? "left" : i === numLabelsX ? "right" : "center";
            context.fillText(longLabel, x, padding);
            context.fillText(longLabel, x, height - padding);
        }

        for (let i = 1; i <= numLabelsY - 1; i++) {
            let y = (i * height) / numLabelsY;
            let latLabel = latLabels[i];

            y = i === 0 ? y + padding : i === numLabelsY ? y - padding : y;

            context.save();
            context.translate(padding, y);
            context.rotate(-Math.PI / 2);
            context.fillText(latLabel, 0, 0);
            context.restore();

            context.save();
            context.translate(width - padding, y);
            context.rotate(Math.PI / 2);
            context.fillText(latLabel, 0, 0);
            context.restore();
        }

        context.restore();
    }

    function generateMap(simplex) {
        const scale = parseFloat(document.getElementById("scale").value);
        const octaves = parseInt(document.getElementById("octaves").value);
        const persistence = parseFloat(
            document.getElementById("persistence").value,
        );
        const threshold = parseFloat(
            document.getElementById("threshold").value,
        );

        console.log(scale);
        console.log(octaves);
        console.log(persistence);
        console.log(threshold);
        document.getElementById("download").style.visibility = "hidden";
        document.getElementById("gen-controls").style.visibility = "hidden";
        document.getElementById("map-canvas").style.display = "none";
        document.getElementById("loading-screen").style.display = "";

        setTimeout(function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawMap(simplex, scale, octaves, persistence, threshold);
            drawGrids(ctx, canvas.width, canvas.height, rows, cols);
            drawBorder(
                ctx,
                canvas.width,
                canvas.height,
                cellWidth,
                cellHeight,
                rows,
                cols,
            );
            drawCrossMarks(ctx, canvas.width, canvas.height, rows, cols);
            drawMapBorder(ctx, width, height);
            fillMapBorder(ctx, width, height);
            drawBorderLabels(
                ctx,
                canvas.width,
                canvas.height,
                cols,
                rows,
                40,
                -120,
                1 / 18,
                1 / 12,
            );
            document.getElementById("map-canvas").style.display = "block";
            document.getElementById("loading-screen").style.display = "none";
            document.getElementById("download").style.visibility = "visible";
            document.getElementById("gen-controls").style.visibility =
                "visible";
        }, 2000);
    }

    document.getElementById("download").addEventListener("click", function () {
        var download = document.getElementById("download");
        ctx.save();
        ctx.fillStyle = "rgb(170, 188, 171)";
        ctx.globalCompositeOperation = "destination-over";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        var image = document
            .getElementById("map-canvas")
            .toDataURL("image/png")
            .replace("image/png", "image/octet-stream");
        download.setAttribute("href", image);
    });

    document.getElementById("download").style.visibility = "visible";
    document.getElementById("gen-controls").style.visibility = "visible";
    document.getElementById("scale").addEventListener("input", function () {
        document.getElementById("scaleValue").textContent = this.value;
    });

    document.getElementById("octaves").addEventListener("input", function () {
        document.getElementById("octavesValue").textContent = this.value;
    });

    document
        .getElementById("persistence")
        .addEventListener("input", function () {
            document.getElementById("persistenceValue").textContent =
                this.value;
        });

    document.getElementById("threshold").addEventListener("input", function () {
        document.getElementById("thresholdValue").textContent = this.value;
    });

    document.getElementById("generate").addEventListener("click", function () {
        let seed = Date.now();
        let openSimplex = openSimplexNoise(seed);
        generateMap(openSimplex.noise2D);
    });

    let seed = Date.now();
    let openSimplex = openSimplexNoise(seed);
    generateMap(openSimplex.noise2D);
});
