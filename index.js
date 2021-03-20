import ThreeMap from './asset/js/ThreeMap'
import MapData from './asset/china'
const threeMap  = new ThreeMap({
    el: document.body,
    width: window.innerWidth,
    height: window.innerHeight,
    mapData: MapData
})

