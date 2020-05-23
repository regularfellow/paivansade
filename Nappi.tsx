import * as React from 'react';
import {createIconSetFromIcoMoon} from '@expo/vector-icons';
import icomoonConfig from './icomoon/selection.json';

const expoAssetId = require('./icomoon/fonts/icomoon.ttf');
export default createIconSetFromIcoMoon(icomoonConfig, 'icomoon', expoAssetId);
