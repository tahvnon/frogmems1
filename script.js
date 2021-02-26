
function qsl(s) { return document.querySelector(s); }
let ctx = qsl('#canvas1').getContext('2d');



function setCtxDrawOpts(ctx, drawOpts) {
  ctx.fillStyle = drawOpts.fillStyle || ctx.fillStyle;
  ctx.strokeStyle = drawOpts.strokeStyle || ctx.strokeStyle;
  ctx.font = drawOpts.font || ctx.font;
}

function getCtxDrawOpts(ctx) {
  return {
    fillStyle: ctx.fillStyle,
    strokeStyle: ctx.strokeStyle,
    font: ctx.font,
  }
}

function drawLayers(layers, ctx) {
  let sortedByZOrderLayers =
    layers.sort(
      (l1, l2) =>
        (l1.zOrder < l2.zOrder) ? -1 : (l1.zOrder === l2.zOrder) ? 0 : 1
    );
  // reset canvas, clearing all state
  ctx.canvas.width = ctx.canvas.width;
  for (layer of sortedByZOrderLayers) {
    if (layer.ready === false) {
      console.log(`skipping layer ${layer.type} (not ready)`)
      continue;
    }
    if (layerHandlers[layer.type] !== undefined) {
      layerHandlers[layer.type](layer, ctx);
    } else {
      console.error(`handler for layer type: ${layer.type} not defined`);
      //console.error(layer);
    }
  }
}
let layerHandlers = {
  'text': function (layer, ctx) {
    ctx.save();
    setCtxDrawOpts(ctx, layer.drawOpts || getCtxDrawOpts(ctx));
    ctx.fillText(layer.text, layer.rect.x, layer.rect.y);
    ctx.restore();
  },
  'image': function (layer, ctx) {
    ctx.save();
    // TODO - implement scaling/rotation, check if layer has
    // options for scaling/rotation
    ctx.drawImage(layer.image, layer.rect.x, layer.rect.y);
    ctx.restore();
  }
}



function makeLayer() {
  return {
    rect: { x: 0, y: 0, w: 0, h: 0 },
    ready: false,
    zOrder: 0,
    drawOpts: { font: '24px sans-serif', fillStyle: 'black' },
  }
}

// naming is hard :(
function makeImageLayer(options) {
  return new Promise(
    (resolve, reject) => {
      let imgObj = {
        ...makeLayer(),
        type: 'image',
        url: options.url || '',
        image: undefined,
        ready: false,
        ...options,
      };
      imgObj.image = new Image();
      imgObj.image.crossOrigin = 'anonymous';
      imgObj.image.src = options.url || '';
      imgObj.image.onload = function () {
        imgObj.ready = true;
        resolve(imgObj);
      }
    });
}

// TODO this does not need to return a promise
function makeTextLayer(options) {
  return new Promise(
    (resolve, reject) => {
      let textObj = {
        ...makeLayer(),
        type: 'text',
        text: options.text || 'text missing',
        ready: true,
        ...options,
      }
      resolve(textObj);
    });
}

let layerMakers = {
  'text': makeTextLayer,
  'image': makeImageLayer,
}


async function makeLayers(layerDescriptions) {
  console.log('creating layers, loading images etc...');

  let a = []

  for(ld of layerDescriptions){
    if(layerMakers[ld.type] !== undefined){
      a.push( layerMakers[ld.type](ld));
    }else{
      console.error(`no idea how to make layer of type ${ld.type}`);
    }
  }

  let layers = await Promise.all(a);

  console.log('finished making layers');
  return layers;
}


let XXX = [
  {
    type: 'text',
    text: 'lol butts',
    rect: { x: 100, y: 100, w: 0, h: 0 },
    drawOpts: { font: '100px sans-serif', fillStyle: 'red' },
    zOrder: 1,
  },
  {
    type: 'image',
    url: 'https://picsum.photos/512/384',
    rect: { x: 0, y: 0, w: 0, h: 0 },
    zOrder: -100
  }
];
qsl('#txt_layers').value = JSON.stringify(XXX, undefined, 2)

async function generate() {
  let layerDescriptions = f();
  let layers = await makeLayers(layerDescriptions);

  drawLayers(layers, ctx);
}

function clearErrorMessage(){
  qsl('#txt_errorMsg').innerHTML = '';
}

function setErrorMessage(msg) {
  console.error(msg);
  qsl('#txt_errorMsg').innerHTML = msg;
}

function f() {
  const layerDescriptionsJson = qsl('#txt_layers').value
  let layerDescriptions;

  try {
    layerDescriptions = JSON.parse(layerDescriptionsJson);
  } catch (error) {
    setErrorMessage(error);
    return [];
  }
  qsl('#txt_layers').value = JSON.stringify(layerDescriptions, undefined, 2);
  clearErrorMessage();
  return layerDescriptions;
}

function hideSnapshotFrame(){
  console.log('hideSnapshotFrame');
  const snapshotFrame = qsl('#snapshotFrame1');
  snapshotFrame.style.display = 'none'
}

function copyCanvasToImage(){
  const snapshotFrame = qsl('#snapshotFrame1');
  snapshotFrame.style.display = ''
  const targetImageElement = qsl('#targetImage1')
  targetImageElement.src = ctx.canvas.toDataURL();
}

function setCanvasSize(){
  const DEFAULT_WIDTH = 512;
  const DEFAULT_HEIGHT = 384;
  let canvasWidth = Number.parseInt(qsl('#txt_canvasWidth').value);
  let canvasHeight= Number.parseInt(qsl('#txt_canvasHeight').value);

  // bad input for some reason, reset to defaults
  if(isNaN(canvasWidth) || isNaN(canvasHeight)){
    canvasWidth = DEFAULT_WIDTH;
    canvasHeight = DEFAULT_HEIGHT;
    qsl('#txt_canvasWidth').value = canvasWidth;
    qsl('#txt_canvasHeighth').value = canvasHeight;
  }

  const canvasElement = qsl('#canvas1')
  canvasElement.width = canvasWidth;
  canvasElement.height = canvasHeight;
  console.log(canvasWidth, canvasHeight);
}

generate();