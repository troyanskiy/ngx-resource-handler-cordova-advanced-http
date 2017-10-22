import {
  IRestHandlerResponse,
  IRestRequest,
  IRestResponse,
  RestHandler,
  RestRequestBodyType,
  RestRequestMethod,
  RestResponseBodyType
} from 'rest-core';

declare const cordova: any;

export class RestHandlerCordovaAdvancedHttp extends RestHandler {

  private http: any = null;

  private methodWithBody = ['post', 'put', 'patch'];

  constructor() {
    super();
    this.initHttp();
  }

  initHttp(http?: any) {

    if (http) {
      this.http = http;
    } else {
      if (cordova && cordova.plugin.http) {
        this.http = cordova.plugin.http;
      }
    }

  }

  handle(req: IRestRequest): IRestHandlerResponse {

    if (!this.http) {
      return this.createErrorResponse('Http is not defined');
    }

    switch (req.requestBodyType) {
      case RestRequestBodyType.JSON:
        this.http.setDataSerializer('json');
        break;
      case RestRequestBodyType.FORM_DATA:
        this.http.setDataSerializer('urlencoded');
        break;

      default:
        return this.createErrorResponse('Supported only json or FormData types');
    }

    let methodName: string = null;

    switch (req.method) {
      case RestRequestMethod.Post:
        methodName = 'post';
        break;
      case RestRequestMethod.Get:
        methodName = 'get';
        break;
      case RestRequestMethod.Put:
        methodName = 'put';
        break;
      case RestRequestMethod.Patch:
        methodName = 'patch';
        break;
      case RestRequestMethod.Delete:
        methodName = 'delete';
        break;
      case RestRequestMethod.Head:
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


  private createResponse(resp: any, req: IRestRequest): Promise<IRestResponse> {

    return new Promise((resolve, reject) => {

      const ret: IRestResponse = {
        status: resp.status,
        body: resp.data,
        headers: resp.headers
      };

      if (ret.body) {

        switch (req.responseBodyType) {

          case RestResponseBodyType.Json:
            ret.body = JSON.parse(ret.body);
            resolve(ret);

            return;

          case RestResponseBodyType.Blob:
            ret.body = new Blob([ret.body], { type: 'text/plain' });
            resolve(ret);

            return;

          case RestResponseBodyType.ArrayBuffer:
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
