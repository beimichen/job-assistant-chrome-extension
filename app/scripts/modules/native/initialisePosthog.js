export function postHogInit(apiKey, address) {
  posthog.init(apiKey, {api_host: address});
}

