var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports", "./widget", "./util", "./canvas", "./renderer", "./point", "./rectangle", "./keymanager"], function (require, exports, widget_1, util_1, canvas_1, renderer_1, point_1, rectangle_1, keymanager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Circle = /** @class */ (function (_super) {
        __extends(Circle, _super);
        function Circle(cropView) {
            var _this = _super.call(this, new point_1.Point(), new point_1.Point()) || this;
            _this.cropView = cropView;
            _this.saveOrigin();
            return _this;
        }
        Object.defineProperty(Circle.prototype, "radius", {
            get: function () {
                return this.size.dividedBy(2);
            },
            set: function (radius) {
                this.size = radius.times(2);
            },
            enumerable: true,
            configurable: true
        });
        Circle.prototype.reset = function () {
            this.position = new point_1.Point(0);
            this.size = new point_1.Point(this.cropView.outerRect.size.min / 2);
        };
        Object.defineProperty(Circle.prototype, "rectangle", {
            get: function () {
                return this.copy();
            },
            enumerable: true,
            configurable: true
        });
        Circle.prototype.saveOrigin = function () {
            this._origin = this.copy();
        };
        Object.defineProperty(Circle.prototype, "origin", {
            get: function () {
                return this._origin;
            },
            enumerable: true,
            configurable: true
        });
        Circle.prototype.validate = function () {
            var ret = 0;
            if (this.width > this.cropView.outerWidth) {
                this.setWidthKeepAR(this.cropView.outerWidth);
                ret |= 1;
            }
            if (this.height > this.cropView.outerHeight) {
                this.setHeightKeepAR(this.cropView.outerHeight);
                ret |= 2;
            }
            if (this.x < 0) {
                this.x = 0;
                ret |= 4;
            }
            if (this.y < 0) {
                this.y = 0;
                ret |= 8;
            }
            if (this.bottom > this.cropView.outerHeight) {
                this.bottom = this.cropView.outerHeight;
                ret |= 16;
            }
            if (this.right > this.cropView.outerWidth) {
                this.right = this.cropView.outerWidth;
                ret |= 32;
            }
            return ret;
        };
        return Circle;
    }(rectangle_1.Rectangle));
    var CropView = /** @class */ (function (_super) {
        __extends(CropView, _super);
        function CropView(settingsObject) {
            var _this = _super.call(this, util_1.createElement("div", "cropView")) || this;
            _this._isZoomFitted = false;
            _this._zoomFactor = 1;
            _this.currentRotation = 0;
            _this.loadingImage = false;
            _this.createEvent("update");
            _this.createEvent("imagechange");
            _this.createEvent("antialiaschange");
            _this.on("update", _this.renderOverlay.bind(_this));
            _this.once("update", function () { return console.log("sup"); });
            _this.settings = settingsObject;
            _this.circle = new Circle(_this);
            _this.renderer = new renderer_1.Renderer(_this);
            _this.image = util_1.createElement("img", "image");
            _this.image.style.transformOrigin = "top left";
            _this.overlay = new canvas_1.Canvas({
                deepCalc: true
            });
            _this.appendChild(_this.image, _this.overlay.canvas);
            document.body.appendChild(_this.renderer.container);
            _this.overlay.mouse.addEventListener("move", _this.mouseMove.bind(_this));
            _this.overlay.mouse.addEventListener("down", _this.mouseDown.bind(_this));
            _this.overlay.canvas.addEventListener("touchmove", function (e) {
                if (!(_this.currentAction === "new" || _this.currentAction === "none")) {
                    e.preventDefault();
                }
            });
            document.body.addEventListener("mouseup", function () {
                var ca = _this.currentAction;
                _this.currentAction = "none";
                if (ca !== "none") {
                    _this.refresh();
                }
            });
            document.body.addEventListener("touchend", function () {
                var ca = _this.currentAction;
                _this.currentAction = "none";
                if (ca !== "none") {
                    _this.refresh();
                }
            });
            // move circle around with arrow keys //
            window.addEventListener("keydown", function (e) { return _this.handleKeypress(e.keyCode); });
            //this.overlay.mouse.addEventListener("leave", this.overlay.mouse.events.up[0]);
            _this.antialias = _this.settings.antialias;
            return _this;
        }
        CropView.prototype.handleKeypress = function (key) {
            if (keymanager_1.KeyManager.isArrowKey(key)) {
                //console.log( KeyManager.axis(Keys.right, Keys.left))
                this.circle.x += keymanager_1.KeyManager.axis(keymanager_1.Keys.right, keymanager_1.Keys.left);
                this.circle.y += keymanager_1.KeyManager.axis(keymanager_1.Keys.down, keymanager_1.Keys.up);
                this.circle.validate();
                this.refresh();
            }
        };
        Object.defineProperty(CropView.prototype, "rotation", {
            get: function () {
                return this.currentRotation;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CropView.prototype, "cropArea", {
            get: function () {
                return this.circle.rectangle;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CropView.prototype, "zoomFactor", {
            get: function () {
                return this._zoomFactor;
            },
            enumerable: true,
            configurable: true
        });
        CropView.prototype.refresh = function () {
            this.emitEvent("update"); // renders overlay
        };
        CropView.prototype.reactTMToRefresh = function () {
            this.isZoomFitted && this.zoomFit();
        };
        CropView.prototype.renderOverlay = function () {
            //console.log("rendering overlay");
            // draw mask //
            if (this.settings.maskOpacity !== 1) {
                this.overlay.clear();
            }
            if (this.settings.maskOpacity !== 0) {
                this.overlay.fill("rgba(0,0,0," + this.settings.maskOpacity + ")");
                this.overlay.blendMode = "destination-out";
                if (this.settings.previewMode === "circle") {
                    this.overlay.fillCircleInRect(this.circle.x, this.circle.y, this.circle.size.x, this.circle.size.y, "white");
                }
                else {
                    this.overlay.fillRect(this.circle.x, this.circle.y, this.circle.size.x, this.circle.size.y, "white");
                }
            }
            this.overlay.blendMode = "source-over";
            var lineWidth = ~~(1 / this.zoomFactor) + 1;
            if (this.settings.outlinesEnabled) {
                var sharp = lineWidth % 2 === 1;
                this.overlay.lineDash = [Math.min(this.overlay.width, this.overlay.height) / 100];
                if (this.settings.previewMode === "circle") {
                    this.overlay.drawCircleInRect(this.circle.x, this.circle.y, this.circle.size.x, this.circle.size.y, "white", lineWidth);
                }
                this.overlay.drawRect(this.circle.x - lineWidth, this.circle.y - lineWidth, this.circle.width + lineWidth, this.circle.height + lineWidth, "white", lineWidth, sharp);
            }
            if (this.settings.guidesEnabled) {
                this.overlay.drawLine(this.circle.cx, this.circle.cy, this.circle.cx, this.circle.bottom, "white", lineWidth);
                this.overlay.drawLine(this.circle.cx, this.circle.cy, this.circle.cx, this.circle.top, "white", lineWidth);
                this.overlay.drawLine(this.circle.cx, this.circle.cy, this.circle.right, this.circle.cy, "white", lineWidth);
                this.overlay.drawLine(this.circle.cx, this.circle.cy, this.circle.left, this.circle.cy, "white", lineWidth);
                this.overlay.context.lineDashOffset = this.overlay.context.getLineDash()[0];
                this.overlay.drawLine(this.circle.cx, this.circle.cy, this.circle.cx, this.circle.bottom, "cyan", lineWidth);
                this.overlay.drawLine(this.circle.cx, this.circle.cy, this.circle.cx, this.circle.top, "cyan", lineWidth);
                this.overlay.drawLine(this.circle.cx, this.circle.cy, this.circle.right, this.circle.cy, "cyan", lineWidth);
                this.overlay.drawLine(this.circle.cx, this.circle.cy, this.circle.left, this.circle.cy, "cyan", lineWidth);
                this.overlay.context.lineDashOffset = 0;
                this.overlay.drawLine(this.circle.cx - lineWidth * 2, this.circle.cy, this.circle.cx + lineWidth * 2, this.circle.cy, "cyan", lineWidth);
                this.overlay.drawLine(this.circle.cx, this.circle.cy - lineWidth * 2, this.circle.cx, this.circle.cy + lineWidth * 2, "cyan", lineWidth);
            }
            /*let theta = (90 - this.rotation) / 180 * Math.PI;
            let cot = (t) => 1 / Math.tan(t);
            
            let cx = this.outerWidth / 2;
            let cy = this.outerHeight / 2;
            
            let circleX = this.circle.cx;
            let circleY = this.circle.cy;
    
            let xc = circleX - cx;
            let yc = cy - circleY;
    
            //console.log(cx, cy, circleX, circleY, dx, dy);
    
            (<any>window).z = theta;
    
            let f = (x) => Math.tan(theta) * x;
            let fp = (x) => -cot(theta) * x;
            let yy = yc - fp(xc);
            let fpc = (x) => -cot(theta) * x + yc + cot(theta) * xc;
            let ix = yy / (Math.tan(theta) + cot(theta));
            let iy = fpc(ix);
    
            console.log(xc, yc);
    
            this.overlay.drawLine(cx, cy, cx + 500, cy - f(500), "red", 2);
            this.overlay.drawLine(cx, cy, cx - 500, cy - f(-500), "red", 2);
    
            this.overlay.drawLine(cx, cy, cx + 500, cy - fp(500), "red", 2);
            this.overlay.drawLine(cx, cy, cx - 500, cy - fp(-500), "red", 2);
    
            this.overlay.drawLine(circleX, circleY, circleX, circleY + yy, "green", 2);
            this.overlay.drawLine(circleX, circleY, cx + ix, cy - iy, "blue", 2);*/
        };
        Object.defineProperty(CropView.prototype, "innerRect", {
            // returns size of image (internal res of image) //
            get: function () {
                return new rectangle_1.Rectangle(point_1.Point.Zero, new point_1.Point(this.image.width, this.image.height));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CropView.prototype, "innerWidth", {
            get: function () {
                return this.image.width;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CropView.prototype, "innerHeight", {
            get: function () {
                return this.image.height;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CropView.prototype, "outerRect", {
            // returns sizes taking rotation into consideration (internal res of overlay) //
            get: function () {
                return new rectangle_1.Rectangle(point_1.Point.Zero, new point_1.Point(this.overlay.width, this.overlay.height));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CropView.prototype, "outerWidth", {
            get: function () {
                return this.overlay.width;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CropView.prototype, "outerHeight", {
            get: function () {
                return this.overlay.height;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CropView.prototype, "apparentWidth", {
            get: function () {
                return this.container.getBoundingClientRect().width;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CropView.prototype, "apparentHeight", {
            get: function () {
                return this.container.getBoundingClientRect().height;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CropView.prototype, "isZoomFitted", {
            get: function () {
                return this._isZoomFitted;
            },
            set: function (z) {
                this._isZoomFitted = z;
                if (z) {
                    this.container.style.overflow = "hidden";
                }
                else {
                    this.container.style.overflow = "";
                }
            },
            enumerable: true,
            configurable: true
        });
        CropView.prototype.zoom = function (factor, shouldUpdate) {
            if (shouldUpdate === void 0) { shouldUpdate = true; }
            var ogScrollTopP = this.container.scrollTop / this.container.scrollHeight;
            var ogScrollLeftP = this.container.scrollLeft / this.container.scrollWidth;
            this.container.scrollTop = 0;
            this.container.scrollLeft = 0;
            var rotatePart = "";
            if (this.image.style.transform.indexOf(" rotate") !== -1) {
                rotatePart = this.image.style.transform.substr(this.image.style.transform.indexOf(" rotate"));
            }
            factor = factor || this.zoomFactor;
            this._zoomFactor = factor;
            this.overlay.zoom(factor);
            this.image.style.transform = "scale(" + factor + "," + factor + ")";
            this.image.style.transform += rotatePart;
            var r = this.image.getBoundingClientRect();
            if (r.left !== 0) {
                var current = parseFloat(this.image.style.left || "0px");
                current -= r.left;
                this.image.style.left = current + "px";
            }
            if (r.top !== 0) {
                var current = parseFloat(this.image.style.top || "0px");
                current -= r.top;
                this.image.style.top = current + "px";
            }
            shouldUpdate && this.refresh();
            this.container.scrollTop = ogScrollTopP * this.container.scrollHeight;
            this.container.scrollLeft = ogScrollTopP * this.contentContainer.scrollWidth;
        };
        CropView.prototype.zoomIn = function () {
            this.isZoomFitted = false;
            this.zoom(this.zoomFactor * 1.1);
        };
        CropView.prototype.zoomOut = function () {
            this.isZoomFitted = false;
            this.zoom(this.zoomFactor / 1.1);
        };
        CropView.prototype.zoomFit = function (force, shouldUpdate) {
            if (force === void 0) { force = true; }
            if (shouldUpdate === void 0) { shouldUpdate = true; }
            if (!this.image) {
                return;
            }
            if (!this.isZoomFitted && !force) {
                return;
            }
            this.isZoomFitted = true;
            /*if (detectIE() !== false) {
                zoom(1);
                return;
            }*/
            var cr = this.container.getBoundingClientRect();
            var ir = { width: this.overlay.width, height: this.overlay.height };
            var fw = cr.width / ir.width;
            var fh = cr.height / ir.height;
            var f = Math.min(fw, fh);
            //document.getElementById("container-canvas").style["width"] = cr.width + "px";
            this.zoom(f, shouldUpdate);
            //console.log("---");
            //console.log("zoom1: ", nr.height / ir.height);
            /*window.requestAnimationFrame(function() {
        
                var delta = container.scrollWidth - container.clientWidth;
                //console.log("dx: ", delta);
            
                if (delta > 0) {
                    nr.width -= delta;
                    nr.height -= (ir.height / ir.width) * delta;
                    zoom(nr.height / ir.height);
                    //console.log("zoomx: ", nr.height / ir.height);
                }
            
                delta = container.scrollHeight - container.clientHeight;
                //console.log("dy: ", delta);
            
                if (delta > 0) {
                    nr.height -= delta;
                    nr.width -= (ir.width / ir.height) * delta;
            
                    zoom(nr.height / ir.height);
                    //console.log("zoomy: ", nr.height / ir.height);
                }
        
            });*/
        };
        CropView.prototype.rotate = function (deg, shouldUpdate) {
            if (shouldUpdate === void 0) { shouldUpdate = true; }
            var odeg = this.currentRotation;
            if (deg === undefined)
                deg = this.currentRotation;
            this.currentRotation = deg;
            if (this.image.style.transform.indexOf(" rotate") !== -1) {
                this.image.style.transform = this.image.style.transform.substr(0, this.image.style.transform.indexOf(" rotate"));
            }
            var b4 = this.image.style.transform;
            this.image.style.left = "0px";
            this.image.style.top = "0px";
            this.overlay.resize(this.image.width, this.image.height);
            var or = this.image.getBoundingClientRect();
            this.image.style.transform = b4 + " rotate(" + deg + "deg)";
            var r = this.image.getBoundingClientRect();
            var dx = -r.left - this.container.scrollLeft;
            var dy = -r.top - this.container.scrollTop;
            this.image.style.left = dx + "px";
            this.image.style.top = dy + "px";
            this.overlay.width *= (r.width / or.width);
            this.overlay.height *= (r.height / or.height);
            /*let circleMagnitude = Math.sqrt(
                Math.pow(this.overlay.width - circle.cx(), 2) +
                Math.pow(this.overlay.height - circle.cy(), 2)
            );
        
            let rad = ((deg - 90) / 180) * Math.PI;
            let orad = ((odeg - 90) / 180) * Math.PI;
        
            let cdx = Math.cos(rad) - Math.cos(orad);
            let cdy = Math.sin(rad) - Math.sin(orad);
            cdx *= circleMagnitude;
            cdy *= circleMagnitude;
        
            circle.x += cdx;
            circle.y += cdy;*/
            this.zoomFit(false, shouldUpdate);
            this.circle.validate();
            shouldUpdate && this.emitEvent("update");
        };
        Object.defineProperty(CropView.prototype, "antialias", {
            get: function () {
                return this.antialiased;
            },
            set: function (antialias) {
                util_1.makePixelated(this.image, !antialias);
                this.overlay.pixelated = !antialias;
                this.antialiased = antialias;
                this.emitEvent("antialiaschange", this.antialiased);
            },
            enumerable: true,
            configurable: true
        });
        CropView.prototype.setImageFromFile = function (file) {
            if (!file || file.type.split("/")[0] !== "image" || this.loadingImage) {
                return false;
            }
            this.currentFileType = file.type.split("/")[1] === "gif" ? "gif" : "png";
            this._filename = file.name.substring(0, file.name.lastIndexOf('.')) + "_cropped." + this.currentFileType;
            this.loadingImage = true;
            canvas_1.Canvas.fileToImage(file, this.setImageFromFileHelper.bind(this), false);
            return true;
        };
        CropView.prototype.setImageFromFileHelper = function (image) {
            if (this.image.src) {
                URL.revokeObjectURL(this.image.src);
            }
            this.overlay.resize(image.width, image.height);
            this.overlay.clear();
            this.image.width = image.width;
            this.image.height = image.height;
            this.image.src = image.src;
            this.circle.reset();
            this.zoomFit(true, false);
            this.rotate(0, false);
            this.emitEvent("imagechange", this.image.src);
            this.refresh();
            this.loadingImage = false;
        };
        CropView.prototype.flipHorizontal = function () {
            var _this = this;
            var c = new canvas_1.Canvas({ width: this.image.width, height: this.image.height });
            c.context.scale(-1, 1);
            c.drawImage(this.image, 0, 0, -this.image.width, this.image.height);
            c.context.setTransform(1, 0, 0, 1, 0, 0);
            this.loadingImage = true;
            c.createImage(function (img) {
                _this.flipHelper(img, true);
            }, undefined, false);
        };
        CropView.prototype.flipVertical = function () {
            var _this = this;
            var c = new canvas_1.Canvas({ width: this.image.width, height: this.image.height });
            c.context.scale(1, -1);
            c.drawImage(this.image, 0, 0, this.image.width, -this.image.height);
            c.context.setTransform(1, 0, 0, 1, 0, 0);
            this.loadingImage = true;
            c.createImage(function (img) {
                _this.flipHelper(img, false);
            }, undefined, false);
        };
        CropView.prototype.flipHelper = function (image, horizontal) {
            var _this = this;
            if (this.image.src) {
                URL.revokeObjectURL(this.image.src);
            }
            this.image.onload = function () {
                _this.rotate(-_this.rotation, false);
                if (horizontal) {
                    _this.circle.cx = _this.outerWidth - _this.circle.cx;
                }
                else {
                    _this.circle.cy = _this.outerHeight - _this.circle.cy;
                }
                _this.emitEvent("imagechange", _this.image.src);
                _this.refresh();
                _this.loadingImage = false;
            };
            this.image.src = image.src;
        };
        CropView.prototype.renderCroppedImage = function () {
            this.renderer.render();
        };
        Object.defineProperty(CropView.prototype, "filename", {
            get: function () {
                return this._filename;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CropView.prototype, "src", {
            get: function () {
                return this.image.src || null;
            },
            enumerable: true,
            configurable: true
        });
        CropView.prototype.centerCropArea = function () {
            this.circle.center = this.outerRect.center;
            this.circle.validate();
            this.refresh();
        };
        CropView.prototype.setCropSize = function (size) {
            this.circle.size = new point_1.Point(size);
            this.circle.validate();
            this.refresh();
        };
        CropView.prototype.getMouseAction = function (x, y) {
            var mousePoint = new point_1.Point(x, y);
            if (this.circle.containsPoint(new point_1.Point(x, y))) {
                // this logic for non-square crop area (aspect ratio != 1:1)
                /*let handleSize = this.circle.radius.min / 2;
                let _rb = (p1, p2) => Rectangle.between(p1, p2);
                let _con = (r : Rectangle) => r.containsPoint(mousePoint);
                let grabbing = (p1 : Point, toAdd : Point | number) => _con(_rb(p1, p1.plus(toAdd)));
                
                let grabbingHandle = (
                    grabbing(this.circle.topLeft, handleSize) ||
                    grabbing(this.circle.topRight, new Point(-handleSize, handleSize)) ||
                    grabbing(this.circle.bottomLeft, new Point(handleSize, -handleSize)) ||
                    grabbing(this.circle.bottomRight, -handleSize)
                );*/
                var grabbingHandle = this.circle.center.distanceTo(new point_1.Point(x, y)) >= this.circle.radius.x;
                return grabbingHandle ? "resize" : "move";
            }
            else {
                return "new";
            }
        };
        CropView.prototype.mouseDown = function (x, y) {
            var action = this.getMouseAction(x, y);
            this.currentAction = action;
            this.mouseOrigin = new point_1.Point(x, y);
            this.circle.saveOrigin();
            this.resizeOffset = this.circle.getPointFromAnchor(this.getCircleAnchor(this.mouseOrigin)).minus(this.mouseOrigin);
        };
        CropView.prototype.mouseMove = function (x, y) {
            // determine what cursor to show //
            var action = this.currentAction;
            if (action === "none") {
                action = this.getMouseAction(x, y);
            }
            if (action === "move") {
                this.overlay.canvas.style.cursor = "move";
            }
            else if (action === "resize") {
                var xr = x < this.circle.cx;
                var yr = y < this.circle.cy;
                var thing = +xr ^ +yr; // nice
                this.overlay.canvas.style.cursor = thing ? "nesw-resize" : "nwse-resize";
            }
            else {
                this.overlay.canvas.style.cursor = "default";
            }
            // actually do stuff //
            if (this.currentAction === "none") {
                return;
            }
            else if (this.currentAction === "move") {
                var d = new point_1.Point(x, y).minus(this.mouseOrigin);
                this.circle.position = this.circle.origin.position.plus(d);
                this.circle.validate();
                this.mouseOrigin = new point_1.Point(x, y);
                this.circle.saveOrigin();
            }
            else if (this.currentAction === "resize") {
                this.performResize(x, y);
            }
            this.circle.round(this.settings.resizeLock); // u rite
            this.emitEvent("update");
        };
        CropView.prototype.getCircleAnchor = function (p) {
            var x = p.x;
            var y = p.y;
            if (x > this.circle.cx) {
                if (y > this.circle.cy) {
                    return "se";
                }
                else {
                    return "ne";
                }
            }
            else {
                if (y > this.circle.cy) {
                    return "sw";
                }
                else {
                    return "nw";
                }
            }
        };
        CropView.prototype.performResize = function (x, y) {
            var anchor = rectangle_1.Rectangle.anchorOpposite(this.getCircleAnchor(new point_1.Point(x, y)));
            if (!this.settings.resizeLock) {
                this.resizeAnchor = this.circle.getPointFromAnchor(anchor).minus(this.resizeOffset);
                var size = this.circle.size.copy();
                var r = rectangle_1.Rectangle.between(new point_1.Point(x, y), this.resizeAnchor);
                //r.round();
                this.circle.fitInsideGreedy(r, anchor, this.outerRect);
                this.circle.validate();
            }
            else {
                var r = rectangle_1.Rectangle.between(new point_1.Point(x, y).plus(this.resizeOffset), this.circle.center);
                r.expandToward(anchor, 2);
                //r.round();
                this.circle.fitInsideGreedyCenter(r, this.outerRect);
                this.circle.validate();
            }
        };
        return CropView;
    }(widget_1.Widget));
    exports.CropView = CropView;
});
//# sourceMappingURL=cropview.js.map