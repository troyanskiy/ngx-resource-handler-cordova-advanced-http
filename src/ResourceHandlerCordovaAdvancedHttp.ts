import {
  IResourceHandlerResponse, IResourceRequest, IResourceResponse, ResourceHandler,
  ResourceRequestBodyType, ResourceRequestMethod, ResourceResponseBodyType
} from '@ngx-resource/core';


declare const cordova: any;

export class ResourceHandlerCordovaAdvancedHttp extends ResourceHandler {

  private http: any = null;

  private methodWithBody = ['post', 'put', 'patch'];

  private initDeferResolve: any = null;
  private initDeferPromise: Promise<any> = null;

  constructor() {
    super();

    this.initDeferPromise = new Promise<any>((resolve) => {
      this.initDeferResolve = resolve;
    });

    this.initHttp();
  }

  initHttp(http?: any) {

    if (http) {
      this.http = http;
      this.resolveDeferInit();
    } else {
      this.initHttpPlugin();
    }

  }

  handle(req: IResourceRequest): IResourceHandlerResponse {

    if (this.initDeferPromise) {
      return {
        promise: this.initDeferPromise
          .then(() => this.handle(req))
          .then((r: IResourceHandlerResponse) => r.promise)
      };
    }


    if (!this.http) {
      return this.createErrorResponse('Http is not defined');
    }

    if (req.requestBodyType === void 0) {
      req.requestBodyType = ResourceRequestBodyType.FORM_DATA;
    }

    switch (req.requestBodyType) {
      case ResourceRequestBodyType.JSON:
        this.http.setDataSerializer('json');
        break;
      case ResourceRequestBodyType.FORM_DATA:
        this.http.setDataSerializer('urlencoded');
        break;

      default:
        return this.createErrorResponse('Supported only json or FormData types');
    }

    let methodName: string = null;

    switch (req.method) {
      case ResourceRequestMethod.Post:
        methodName = 'post';
        break;
      case ResourceRequestMethod.Get:
        methodName = 'get';
        break;
      case ResourceRequestMethod.Put:
        methodName = 'put';
        break;
      case ResourceRequestMethod.Patch:
        methodName = 'patch';
        break;
      case ResourceRequestMethod.Delete:
        methodName = 'delete';
        break;
      case ResourceRequestMethod.Head:
        methodName = 'head';
        break;

      default:
        return this.createErrorResponse('Request method is not supported');

    }

    let url = req.url;
    let second = req.body;

    if (this.methodWithBody.indexOf(methodName) > -1) {

      if (req.query) {
        const params: string = Object.keys(req.query)
          .map((key: string) => `${key}=${req.query[key]}`)
          .join('&');

        url += (url.indexOf('?') === -1 ? '?' : '&') + encodeURI(params);
      }

    } else {

      second = req.query;

    }


    const promise = new Promise((resolve, reject) => {
      this.http[methodName](url, second, req.headers, resolve, reject);
    })
      .catch((resp: any) => {
        throw this.createResponse(resp, req);
      })
      .then((resp: any) => this.createResponse(resp, req));

    return {promise};

  }

  private initHttpPlugin() {
    if (this.tryToSetPlugin()) {
      this.resolveDeferInit();
    } else {
      document.addEventListener('deviceready', () => {
        if (!this.tryToSetPlugin()) {
          console.warn('Can not set http plugin after device ready');
        }
        this.resolveDeferInit();
      }, false);
    }
  }

  private tryToSetPlugin(): boolean {

    if (!this.http && cordova && cordova.plugin && cordova.plugin.http) {
      this.http = cordova.plugin.http;
    }

    return !!this.http;
  }

  private resolveDeferInit() {
    this.initDeferResolve();
    this.initDeferResolve = null;
    this.initDeferPromise = null;
  }

  private createResponse(resp: any, req: IResourceRequest): Promise<IResourceResponse> {

    return new Promise((resolve, reject) => {

      const ret: IResourceResponse = {
        status: resp.status,
        body: resp.data,
        headers: resp.headers
      };

      if (ret.body) {

        switch (req.responseBodyType) {

          case ResourceResponseBodyType.Json:
            ret.body = JSON.parse(ret.body);
            resolve(ret);

            return;

          case ResourceResponseBodyType.Blob:
            ret.body = new Blob([ret.body], { type: 'text/plain' });
            resolve(ret);

            return;

          case ResourceResponseBodyType.ArrayBuffer:
            const fileReader = new FileReader();

            fileReader.onload = function () {
              ret.body = this.result;
              resolve(ret);
            };

            fileReader.onerror = function () {
              reject({
                status: 0,
                body: null,
                headers: {}
              });
            };

            fileReader.readAsArrayBuffer(
              new Blob([ret.body], {
                type: 'text/plain'
              })
            );

            return;

        }
      }

      resolve(ret);

    });

  }


  private createErrorResponse(msg: string) {
    return {
      promise: Promise.reject(new Error(msg))
    };
  }

}
