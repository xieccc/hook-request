# hook-request

This library provides a way to hook into the native XMLHttpRequest and Fetch API calls in a browser. It allows you to intercept requests and responses to execute custom logic such as logging.

## Features

- Intercept and modify XHR and Fetch requests and responses.
- Access the request and response context.

## Installation

``` sh
npm install hook-request
// OR
yarn add hook-request
// OR
pnpm install hook-request
```

## Usage

To use the hooking functionality, you need to call `hookRequest` with the desired options.

### `hookRequest(options, window?)`

This function injects hooks into the browser's XHR and Fetch.

#### Parameters
- options: Configuration options for request hooks.

  The options allows you to specify the following optional callback functions:

  - onRequest: Called when request.
  - onResponse: Called when received response.
  - onError: Called when an error occurs during the request.

  Each callback provides a context object (IContext) which includes the request and response details, and for XHR, the actual XMLHttpRequest object.

- window: The global window object, defaults to the current window. 

#### Return

Return An object containing unHook and reHook functions to remove or reapply the hook.

#### Example

``` javascript
import { hookRequest } from 'hook-request';

hookRequest({
  onRequest: (context, xhr) => {
    console.log('onRequest', context);
  },
  onResponse: (context, xhr) => {
    console.log('onResponse', context);
  },
  onError: (err, context) => {
    console.error('onError', err);
  }
});
```

## API

### hookRequest

`hookRequest(options: IOptions, win?: Window): { unHook, reHook }`

Hook into both XMLHttpRequest and fetch APIs.

- options: The options to configure the hooks.
- win: The window object which defaults to the current window.

Returns an object with unHook and reHook methods to control the hook.


### hookXHR

`hookXHR(options: IOptions, win?: Window): { unHookXHR, reHookXHR }`

Hook into the `XMLHttpRequest`.

### hookFetch

`hookFetch(options: IOptions, win?: Window): { unHookFetch, reHookFetch }`

Hook into the `fetch`.
