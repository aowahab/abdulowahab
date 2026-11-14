import test from 'node:test';import assert from 'node:assert/strict';
import {resizeAnnotation,setAnnotationFont,shapePoints} from '../src/pdfGeometry.js';
const mark={type:'rectangle',x:.2,y:.3,w:.3,h:.2};
test('resize edges keep opposite edges anchored and stay on the page',()=>{const r=resizeAnnotation(mark,'nw',-.1,-.1);assert(Math.abs(r.x-.1)<1e-8);assert(Math.abs(r.x+r.w-.5)<1e-8);assert(Math.abs(r.y+r.h-.5)<1e-8);const c=resizeAnnotation(mark,'se',2,2);assert.equal(c.x+c.w,1);assert.equal(c.y+c.h,1);});
test('shift resize preserves original shape proportions',()=>{const r=resizeAnnotation(mark,'se',.15,.01,{shiftKey:true});assert(Math.abs(r.w/r.h-mark.w/mark.h)<1e-8);});
test('text resize and font buttons scale geometry with the font',()=>{const text={...mark,type:'text',size:20};const r=resizeAnnotation(text,'se',.15,.1);assert(Math.abs(r.size-30)<1e-8);const smaller=setAnnotationFont(text,10);assert(Math.abs(smaller.size-10)<1e-8);assert(Math.abs(smaller.w-.15)<1e-8);assert(Math.abs(smaller.h-.1)<1e-8);});
test('ellipse is closed and arrow has a shaft and head',()=>{const pts=shapePoints({type:'ellipse'});assert.equal(pts.length,65);assert(Math.abs(pts[0].x-pts.at(-1).x)<1e-8);assert(shapePoints({type:'arrow'}).length>3);});

test("arrow direction follows the drag",()=>{const points=shapePoints({type:"arrow",flipX:true,flipY:true});assert(points[0].x>points[1].x);assert(points[0].y<points[1].y);});
