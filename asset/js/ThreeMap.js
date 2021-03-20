import * as THREE from 'three';
import * as d3 from 'd3-geo';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {Geometry} from "three/examples/jsm/deprecated/Geometry";

export default class ThreeMap {
    constructor(options){
        window._this = this
        this.options = options
        this.width = options.width
        this.height = options.height
        this.init()
        this.render()
    }

    init(){
        this.setDomElement()
        // 设置场景
        this.setScene()
        // 设置相机
        this.setCamera()
        // 设置渲染器
        this.setRender()
        // 设置光照
        this.setLight()
        // 设置辅助线
        this.setAxesHelper()
        // 设置相机控制器
        this.setOrbitControls()
        //绘制地图数据
        this.drawMapData()

    }

    setDomElement(){
        const {el} = this.options
        if(typeof el === "string"){
            this.domElement = document.querySelector(el)
        }else{
            this.domElement = el || document.body
        }
    }

    setScene(){
        this.scene = new THREE.Scene();
    }

    setCamera(){
        this.camera = new THREE.PerspectiveCamera( 75, this.width / this.height, 0.1, 1000 );
        this.camera.lookAt(0, 0, 0);
        this.camera.up.x = 0
        this.camera.up.y = 0
        this.camera.up.z = 1
        this.camera.position.x = 1
        this.camera.position.y = 1
        this.camera.position.z = 5
    }

    setRender(){
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize( this.width, this.height );
        renderer.setClearColor(0xb9d3ff, 1); //设置背景颜色
        this.renderer = renderer
    }

    setLight(){
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        this.scene.add(directionalLight);
    }

    setAxesHelper(){
        const axesHelper = new THREE.AxesHelper( 100 );
        this.scene.add( axesHelper );
    }

    setOrbitControls(){
        const controls = new OrbitControls(this.camera, this.renderer.domElement)
        controls.addEventListener('change', _ => {
            this.render()
        })
    }

    render(){
        this.renderer.render(this.scene, this.camera)
        this.domElement.appendChild( this.renderer.domElement );
    }

    drawMapData(){
        const mapData = this.options.mapData
        mapData.features.forEach(d => {
            d.vector3 = [];
            d.geometry.coordinates.forEach((coordinates, i) => {
                d.vector3[i] = [];
                coordinates.forEach((c, j) => {
                    if (c[0] instanceof Array) {
                        d.vector3[i][j] = [];
                        c.forEach(cinner => {
                            let cp = this.lnglatToMector(cinner);
                            d.vector3[i][j].push(cp);
                        });
                    } else {
                        let cp = this.lnglatToMector(c);
                        d.vector3[i].push(cp);
                    }
                });
            });
        });
        // 绘制地图模型
        const group = new THREE.Group();
        mapData.features.forEach(d => {
            const g = new THREE.Group(); // 用于存放每个地图模块。||省份
            g.data = d;
            d.vector3.forEach(points => {
                // 多个面
                if (points[0][0] instanceof Array) {
                    points.forEach(p => {
                        const mesh = this.drawModel(p);
                        g.add(mesh);
                    });
                } else {
                    // 单个面
                    const mesh = this.drawModel(points);
                    g.add(mesh);
                }
            });
            group.add(g);
        });
        this.scene.add(group);
    }

    /**
     * @desc 绘制地图模型 points 是一个二维数组 [[x,y], [x,y], [x,y]]
     */
    drawModel(points) {
        const shape = new THREE.Shape();
        points.forEach((d, i) => {
            const [x, y] = d;
            if (i === 0) {
                shape.moveTo(x, y);
            } else if (i === points.length - 1) {
                shape.quadraticCurveTo(x, y, x, y);
            } else {
                shape.lineTo(x, y, x, y);
            }
        });

        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: -1,
            bevelEnabled: false
        });
        const material = new THREE.MeshBasicMaterial({
            color: '#006de0',
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }
    /**
     * @desc 经纬度转换成墨卡托投影
     * @param {array} 传入经纬度
     * @return array [x,y,z]
     */
    lnglatToMector(lnglat) {
        if (!this.projection) {
            this.projection = d3
                .geoMercator()
                .center([108.904496, 32.668849])
                .rotate([0, 0, -Math.PI/2])
                .scale(10)
                .translate([0, 0]);
        }
        const [y, x ] = this.projection(lnglat);
        let z = 0;
        return [x, y, z];
    }
}



