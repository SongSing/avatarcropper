import { Widget } from "./widget";
import { createElement, showElement, hideElement, makePixelated } from "./util";
import { Canvas } from "./canvas";
import { ShallowCircle, CropView } from "./cropview";
import { Point } from "./point";

export class Preview extends Widget
{
    private mask : Canvas;
    private image : HTMLImageElement;
    private onlineIndicator : Canvas;
    private bottomBar : HTMLElement;
    private sizeDisplay : HTMLElement;
    private removeButton : HTMLElement;
    private _size : Point;
    private cropView : CropView;
    private lastMode : "square" | "circle" | "none" = "none";
    private antialiased : boolean;

    constructor(size : Point, cropView : CropView)
    {
        super(createElement("div", "preview"));

        this.createEvent("requestremove");

        this.cropView = cropView;
        this.cropView.on("update", this.update.bind(this));
        this.cropView.on("imagechange", (src : string) =>
        {
            this.image.src = src;
        });
        this.cropView.on("antialiaschange", (aa : boolean) =>
        {
            this.antialias = aa;
        });

        this._size = size;

        this.container.style.width = size.x + "px";
        this.container.style.height = (size.y + 2) + "px";
        (<any>this.container.style)["z-index"] = -size;

        this.mask = new Canvas({
            width: size.x,
            height: size.y + 2
        });
        this.mask.canvas.className = "mask";
        (<any>this.mask.canvas.style)["z-index"] = 1;
        this.mask.canvas.style.position = "absolute";

        this.image = <HTMLImageElement>createElement("img", "image");
        this.image.style.position = "absolute";
        (<any>this.image.style)["transform-origin"] = "top left";
        if (cropView.src)
        {
            this.image.src = cropView.src;
        }
        this.image.style.position = "absolute";

        if (size.equals(new Point(30)))
        {
            this.onlineIndicator = new Canvas({ width: 14, height: 14 });
            this.onlineIndicator.fillCircleInSquare(0, 0, 14, "#2F3136");
            this.onlineIndicator.fillCircleInSquare(2, 2, 10, "rgb(67,181,129)");
            this.onlineIndicator.canvas.className = "onlineIndicator";
        }

        this.bottomBar = createElement("div", "bottomBar");
        
        this.sizeDisplay = createElement("div", "size");
        this.sizeDisplay.innerText = size + "x" + size;
        
        this.removeButton = createElement("button", "remove");
        this.removeButton.innerText = "✖";
        this.removeButton.addEventListener("click", () =>
        {
            this.emitEvent("requestremove");
        });

        this.bottomBar.appendChild(this.sizeDisplay);
        this.bottomBar.appendChild(this.removeButton);

        this.appendChild(this.image, this.mask.canvas, (this.onlineIndicator && this.onlineIndicator.canvas) || null, this.bottomBar);

        this.container.addEventListener("mouseenter", () =>
        {
            showElement(this.bottomBar);
        });

        this.container.addEventListener("mouseleave", () =>
        {
            hideElement(this.bottomBar);
        });

        hideElement(this.bottomBar);

        this.antialias = true;
    }

    public get size() : Point
    {
        return this._size;
    }

    public update()
    {
        if (this.cropView.settings.previewMode !== this.lastMode)
        {
            this.lastMode = this.cropView.settings.previewMode;

            if (this.lastMode === "square")
            {
                this.mask.clear();
                if (this.onlineIndicator)
                {
                    hideElement(this.onlineIndicator.canvas);
                }
            }
            else
            {
                this.mask.fill("#2F3136");
                this.mask.blendMode = "destination-out";
                this.mask.fillCircleInRect(0, 0, this.size.x, this.size.y, "white");
                this.mask.blendMode = "source-over";
                if (this.onlineIndicator)
                {
                    showElement(this.onlineIndicator.canvas);
                }
            }
        }

        let scale = this.size.dividedBy(this.cropView.cropArea.diameter);
        this.image.style.transform = "scale(" + scale.x + "," + scale.y + ") rotate(" + this.cropView.rotation + "deg)";


        let p = new Point(0);
        p.subtract(this.cropView.cropArea.position.times(scale));

        let dp = new Point(
            parseFloat(this.cropView.image.style.left || "0px"),
            parseFloat(this.cropView.image.style.top || "0px")
        );

        dp.multiply(1 / this.cropView.zoomFactor);

        p.add(dp.times(scale));

        this.image.style.left = p.x + "px";
        this.image.style.top = p.y + "px";
    }

    public set antialias(antialias : boolean)
    {
        makePixelated(this.image, !antialias);
        this.antialiased = antialias;
    }

    public get antialias() : boolean
    {
        return this.antialiased;
    }
}