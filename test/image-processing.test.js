import test from 'node:test';
import assert from 'node:assert/strict';
import {checkedDimensions,boundedCrop,cropForRatio} from '../src/imageProcessing.js';
test('pixel limits reject invalid or excessive canvas allocations',()=>{assert.deepEqual(checkedDimensions('1200','800'),{width:1200,height:800});for(const dims of [[0,5],[100.5,4],[8001,1],[5000,5000],['bad',300]])assert.throws(()=>checkedDimensions(...dims));});
test('crop stays inside the decoded image',()=>{assert.deepEqual(boundedCrop({x:-50,y:900,w:1000,h:500},800,600),{x:0,y:599,w:800,h:1});assert.deepEqual(boundedCrop({x:700,y:500,w:500,h:500},800,600),{x:700,y:500,w:100,h:100});});
test('crop presets fit and centre landscape or portrait photos',()=>{assert.deepEqual(cropForRatio(1200,800,1),{x:200,y:0,w:800,h:800});assert.deepEqual(cropForRatio(800,1200,1),{x:0,y:200,w:800,h:800});assert.deepEqual(cropForRatio(1200,800,0),{x:0,y:0,w:1200,h:800});});
