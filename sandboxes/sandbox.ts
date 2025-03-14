
window.addEventListener('message', async function (event) {
  const source = event.source as {
    window: WindowProxy
  }

  const data = event.data;
  const messageId = data.messageId;
  const argumentName = data.argumentName;
  const argumentValue = data.argumentValue;
  const script = data.script;

  const wholeScript = `let ${argumentName} = "${argumentValue}"; ` + script
  const result = eval(wholeScript)
  source.window.postMessage({ messageId, result: result }, event.origin);
});
