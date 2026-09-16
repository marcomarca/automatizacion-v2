export class RuntimeElement extends HTMLElement {
    runtimeConnected = false;
    _runtime = null;
    onHassChange = () => this.update();
    onViewChange = () => this.update();
    set runtime(value) {
        if (this._runtime === value)
            return;
        this.disconnectRuntime();
        this._runtime = value;
        this.connectRuntime();
        this.update();
    }
    get runtime() {
        return this._runtime;
    }
    connectedCallback() {
        this.connectRuntime();
    }
    disconnectedCallback() {
        this.disconnectRuntime();
    }
    connectRuntime() {
        if (!this.isConnected || !this._runtime || this.runtimeConnected)
            return;
        this._runtime.addEventListener("hass-change", this.onHassChange);
        this._runtime.addEventListener("view-change", this.onViewChange);
        this.runtimeConnected = true;
    }
    disconnectRuntime() {
        if (!this._runtime || !this.runtimeConnected)
            return;
        this._runtime.removeEventListener("hass-change", this.onHassChange);
        this._runtime.removeEventListener("view-change", this.onViewChange);
        this.runtimeConnected = false;
    }
}
