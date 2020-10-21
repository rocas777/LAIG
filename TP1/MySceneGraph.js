const DEGREE_TO_RAD = Math.PI / 180;

// Order of the groups in the XML document.
let INITIALS_INDEX = 0;
let VIEWS_INDEX = 1;
let ILLUMINATION_INDEX = 2;
let LIGHTS_INDEX = 3;
let TEXTURES_INDEX = 4;
let MATERIALS_INDEX = 5;
let NODES_INDEX = 6;

/**
 * MySceneGraph class, representing the scene graph.
 */
class MySceneGraph {
    /**
     * Constructor for MySceneGraph class.
     * Initializes necessary variables and starts the XML file reading process.
     * @param {string} filename - File that defines the 3D scene
     * @param {XMLScene} scene
     */
    constructor(filename, scene) {
        this.loadedOk = null;

        // Establish bidirectional references between scene and graph.
        this.scene = scene;
        scene.graph = this;

        this.nodes = [];

        this.idRoot = null; // The id of the root element.

        this.axisCoords = [];
        this.rootNode = null;
        this.axisCoords['x'] = [1, 0, 0];
        this.axisCoords['y'] = [0, 1, 0];
        this.axisCoords['z'] = [0, 0, 1];

        // File reading 
        this.reader = new CGFXMLreader();

        /*
         * Read the contents of the xml file, and refer to this class for loading and error handlers.
         * After the file is read, the reader calls onXMLReady on this object.
         * If any error occurs, the reader calls onXMLError on this object, with an error message
         */
        this.reader.open('scenes/' + filename, this);
    }

    /*
     * Callback to be executed after successful reading
     */
    onXMLReady() {
        this.log("XML Loading finished.");
        let rootElement = this.reader.xmlDoc.documentElement;

        // Here should go the calls for different functions to parse the various blocks
        let error = this.parseXMLFile(rootElement);

        if (error != null) {
            this.onXMLError(error);
            return;
        }

        this.loadedOk = true;

        // As the graph loaded ok, signal the scene so that any additional initialization depending on the graph can take place
        this.scene.onGraphLoaded();
    }

    /*
     * Callback to be executed on any read error, showing an error on the console.
     * @param {string} message
     */
    onXMLError(message) {
        console.error("XML Loading Error: " + message);
        this.loadedOk = false;
    }

    /**
     * Callback to be executed on any minor error, showing a warning on the console.
     * @param {string} message
     */
    onXMLMinorError(message) {
        console.warn("Warning: " + message);
    }

    /**
     * Callback to be executed on any message.
     * @param {string} message
     */
    log(message) {
        console.log("   " + message);
    }

    /**
     * Parses the XML file, processing each block.
     * @param {XML root element} rootElement
     */
    parseXMLFile(rootElement) {
        if (rootElement.nodeName != "lsf")
            return "root tag <lsf> missing";

        let nodes = rootElement.children;

        // Reads the names of the nodes to an auxiliary buffer.
        let nodeNames = [];

        for (let i = 0; i < nodes.length; i++) {
            nodeNames.push(nodes[i].nodeName);
        }

        let error;

        // Processes each node, verifying errors.

        // <initials>
        let index;
        if ((index = nodeNames.indexOf("initials")) == -1)
            return "tag <initials> missing";
        else {
            if (index != INITIALS_INDEX)
                this.onXMLMinorError("tag <initials> out of order " + index);

            //Parse initials block40
            if ((error = this.parseInitials(nodes[index])) != null)
                return error;
        }

        // <views>
        if ((index = nodeNames.indexOf("views")) == -1)
            return "tag <views> missing";
        else {
            if (index != VIEWS_INDEX)
                this.onXMLMinorError("tag <views> out of order");

            //Parse views block
            if ((error = this.parseViews(nodes[index])) != null)
                return error;
        }

        // <illumination>
        if ((index = nodeNames.indexOf("illumination")) == -1)
            return "tag <illumination> missing";
        else {
            if (index != ILLUMINATION_INDEX)
                this.onXMLMinorError("tag <illumination> out of order");

            //Parse illumination block
            if ((error = this.parseIllumination(nodes[index])) != null)
                return error;
        }

        // <lights>
        if ((index = nodeNames.indexOf("lights")) == -1)
            return "tag <lights> missing";
        else {
            if (index != LIGHTS_INDEX)
                this.onXMLMinorError("tag <lights> out of order");

            //Parse lights block
            if ((error = this.parseLights(nodes[index])) != null)
                return error;
        }
        // <textures>
        if ((index = nodeNames.indexOf("textures")) == -1)
            return "tag <textures> missing";
        else {
            if (index != TEXTURES_INDEX)
                this.onXMLMinorError("tag <textures> out of order");

            //Parse textures block
            if ((error = this.parseTextures(nodes[index])) != null)
                return error;
        }

        // <materials>
        if ((index = nodeNames.indexOf("materials")) == -1)
            return "tag <materials> missing";
        else {
            if (index != MATERIALS_INDEX)
                this.onXMLMinorError("tag <materials> out of order");

            //Parse materials block
            if ((error = this.parseMaterials(nodes[index])) != null)
                return error;
        }

        // <nodes>
        if ((index = nodeNames.indexOf("nodes")) == -1)
            return "tag <nodes> missing";
        else {
            if (index != NODES_INDEX)
                this.onXMLMinorError("tag <nodes> out of order");

            //Parse nodes block
            if ((error = this.parseNodes(nodes[index])) != null)
                return error;
        }
        this.log("all parsed");
    }

    /**
     * Parses the <initials> block. 
     * @param {initials block element} initialsNode
     */
    parseInitials(initialsNode) {
        let children = initialsNode.children;
        let nodeNames = [];

        for (let i = 0; i < children.length; i++)
            nodeNames.push(children[i].nodeName);

        let rootIndex = nodeNames.indexOf("root");
        let referenceIndex = nodeNames.indexOf("reference");

        // Get root of the scene.
        if (rootIndex == -1)
            return "No root id defined for scene.";

        let rootNode = children[rootIndex];
        let id = this.reader.getString(rootNode, 'id');
        if (id == null)
            return "No root id defined for scene.";

        this.idRoot = id;

        // Get axis length        
        if (referenceIndex == -1)
            this.onXMLMinorError("no axis_length defined for scene; assuming 'length = 1'");

        let refNode = children[referenceIndex];
        let axis_length = this.reader.getFloat(refNode, 'length');
        if (axis_length == null)
            this.onXMLMinorError("no axis_length defined for scene; assuming 'length = 1'");

        this.referenceLength = axis_length;

        this.log("Parsed initials");

        return null;
    }

    /**
     * Parses the <views> block.
     * @param {view block element} viewsNode
     */
    parseViews(viewsNode) {
        this.views = [];
        let children = viewsNode.children;
        if (children.length <= 0) {
            this.onXMLError("The Xml does not define any camera, using Default Camera");
        }
        for (let i = 0; i < children.length; i++) {
            let key = this.reader.getString(children[i], "id");
            if (this.views[key] != null) {
                return "ID must be unique for each camera (conflict: ID = " + key + ")";
            }
            let near = this.reader.getFloat(children[i], 'near')
            let far = this.reader.getFloat(children[i], 'far')
            if (near == null) {
                near = 0.1;
                this.onXMLMinorError("Camera '" + key + "near value not defined, set to -0.1")
            }
            if (far == null) {
                far = 400
                this.onXMLMinorError("Camera '" + key + "far value not defined, set to 400")
            }
            let position;
            let target;
            let up;
            let grandChildren = viewsNode.children[i].children;
            for (let u = 0; u < grandChildren.length; u++) {
                if (grandChildren[u].nodeName == "from") {
                    position = this.parseCoordinates3D(grandChildren[u], "view position error");
                    position.push(0);
                }
                if (grandChildren[u].nodeName == "to") {
                    target = this.parseCoordinates3D(grandChildren[u], "view target error");
                    target.push(0);
                }
                if (grandChildren[u].nodeName == "up") {
                    up = this.parseCoordinates3D(grandChildren[u], "view direction error");
                    up.push(0);
                }
            }
            if (children[i].nodeName == "perspective") {
                let angle = this.reader.getFloat(children[i], 'angle');
                if (angle == null) {
                    angle = 45;
                    this.onXMLMinorError("Camera '" + key + "angle value not defined, set to 45")
                }
                angle = angle / 180.0 * 3.1415
                this.views[key] = new CGFcamera(angle, near, far, position, target);
            }
            if (children[i].nodeName == "ortho") {
                let left = this.reader.getFloat(children[i], 'left')
                let right = this.reader.getFloat(children[i], 'right')
                let top = this.reader.getFloat(children[i], 'top')
                let bottom = this.reader.getFloat(children[i], 'bottom')

                if (left == null) {
                    left = -5;
                    this.onXMLMinorError("Camera '" + key + "left value not defined, set to -5")
                }
                if (right == null) {
                    right = 5;
                    this.onXMLMinorError("Camera '" + key + "right value not defined, set to 5")
                }
                if (bottom == null) {
                    bottom = -5;
                    this.onXMLMinorError("Camera '" + key + "bottom value not defined, set to -5")
                }
                if (top == null) {
                    top = 5;
                    this.onXMLMinorError("Camera '" + key + "top value not defined, set to 5")
                }

                this.views[key] = new CGFcameraOrtho(left, right, bottom, top, near, far, position, target, up);
            }
            this.views[key].cameraId = key;
        }
        return null;
    }

    /**
     * Parses the <illumination> node.
     * @param {illumination block element} illuminationsNode
     */
    parseIllumination(illuminationsNode) {

        let children = illuminationsNode.children;

        this.ambient = [];
        this.background = [];

        let nodeNames = [];

        for (let i = 0; i < children.length; i++)
            nodeNames.push(children[i].nodeName);

        let ambientIndex = nodeNames.indexOf("ambient");
        let backgroundIndex = nodeNames.indexOf("background");

        let color;
        if (ambientIndex < 0) {
            this.onXMLMinorError("Ambient color not defined");
            color = [0.2, 0.2, 0.2, 1]
        } else {

            color = this.parseColor(children[ambientIndex], "ambient");
            console.log(color)
        }
        if (!Array.isArray(color))
            return color;
        else
            this.ambient = color;

        if (backgroundIndex < 0) {
            this.onXMLMinorError("Background color not defined");
            color = [1, 1, 1, 1]
        } else
            color = this.parseColor(children[backgroundIndex], "background");
        if (!Array.isArray(color))
            return color;
        else
            this.background = color;

        this.log("Parsed Illumination.");

        return null;
    }

    /**
     * Parses the <light> node.
     * @param {lights block element} lightsNode
     */
    parseLights(lightsNode) {
        let children = lightsNode.children;

        this.lights = [];
        let numLights = 0;

        let grandChildren = [];
        let nodeNames = [];

        if (children.length > 8) {
            this.onXMLMinorError("Maximum number of lights is 8, tried to use " + children.length + ".")
        }
        for (let i = 0; i < children.length && i < 8; i++) {

            // Storing light information
            let global = [];
            let attributeNames = [];
            let attributeTypes = [];

            //Check type of light
            if (children[i].nodeName != "light") {
                this.onXMLMinorError("unknown tag <" + children[i].nodeName + ">");
                continue;
            } else {
                attributeNames.push(...["enable", "position", "ambient", "diffuse", "specular"]);
                attributeTypes.push(...["boolean", "position", "color", "color", "color"]);
            }

            // Get id of the current light.
            let lightId = this.reader.getString(children[i], 'id');
            if (lightId == null)
                return "no ID defined for light";

            // Checks for repeated IDs.
            if (this.lights[lightId] != null)
                return "ID must be unique for each light (conflict: ID = " + lightId + ")";

            grandChildren = children[i].children;
            // Specifications for the current light.

            nodeNames = [];
            for (let j = 0; j < grandChildren.length; j++) {
                nodeNames.push(grandChildren[j].nodeName);
            }

            for (let j = 0; j < attributeNames.length; j++) {
                let attributeIndex = nodeNames.indexOf(attributeNames[j]);
                let aux = 0;
                if (attributeIndex < 0 && attributeNames[j] == "enable") {
                    global.push(false);
                    this.onXMLMinorError("Enable value for light '" + lightId + "' was not set, used default value 0")
                } else if (attributeIndex != -1) {
                    if (attributeTypes[j] == "boolean")
                        aux = this.parseBoolean(grandChildren[attributeIndex], "value", "enabled attribute for light of ID" + lightId);
                    else if (attributeTypes[j] == "position") {
                        aux = this.parseCoordinates4D(grandChildren[attributeIndex], "light position for ID" + lightId);

                    } else
                        aux = this.parseColor(grandChildren[attributeIndex], attributeNames[j] + " illumination for ID" + lightId);

                    if (typeof aux === 'string') {
                        return aux;
                    }

                    global.push(aux);
                } else
                    return "light " + attributeNames[j] + " undefined for ID = " + lightId;
            }
            global.push(lightId);
            this.lights[lightId] = global;
            numLights++;
        }

        if (numLights == 0)
            this.onXMLError("At least one light should be defined");
        else if (numLights > 8)
            this.onXMLMinorError("too many lights defined; WebGL imposes a limit of 8 lights");

        this.log("Parsed lights");
        return null;
    }

    /**
     * Parses the <textures> block. 
     * @param {textures block element} texturesNode
     */
    parseTextures(texturesNode) {
        let children = texturesNode.children;
        this.textures = [];
        for (let i = 0; i < children.length; i++) {
            let key = this.reader.getString(children[i], "id");
            let path = this.reader.getString(children[i], "path")
            if (this.textures[key] != null) {
                return "ID must be unique for each texture (conflict: ID = " + key + ")";
            }
            try {
                if (checkFileExist(path)) {
                    this.textures[key] = new CGFtexture(this.scene, path);
                } else {
                    this.textures[key] = "clear"
                }
            } catch {

            }
        }
        return null;
    }

    /**
     * Parses the <materials> node.
     * @param {materials block element} materialsNode
     */
    parseMaterials(materialsNode) {
        let children = materialsNode.children;

        this.materials = [];

        let grandChildren = [];
        let nodeNames = [];

        // Any number of materials.
        for (let i = 0; i < children.length; i++) {

            if (children[i].nodeName != "material") {
                this.onXMLMinorError("unknown tag <" + children[i].nodeName + ">");
                continue;
            }

            // Get id of the current material.
            let materialID = this.reader.getString(children[i], 'id');
            if (materialID == null)
                return "no ID defined for material";

            // Checks for repeated IDs.
            if (this.materials[materialID] != null)
                return "ID must be unique for each light (conflict: ID = " + materialID + ")";

            let grandChildren = children[i].children;
            this.materials[materialID] = new CGFappearance(this.scene);
            for (let u = 0; u < grandChildren.length; u++) {
                let color;

                if (grandChildren[u].nodeName == "ambient") {
                    color = this.parseColor(grandChildren[u], "Color ERROR");
                    this.materials[materialID].setAmbient(color[0], color[1], color[2], color[3]);
                } else if (grandChildren[u].nodeName == "diffuse") {
                    color = this.parseColor(grandChildren[u], "Color ERROR");
                    this.materials[materialID].setDiffuse(color[0], color[1], color[2], color[3]);
                } else if (grandChildren[u].nodeName == "specular") {
                    color = this.parseColor(grandChildren[u], "Color ERROR");
                    this.materials[materialID].setSpecular(color[0], color[1], color[2], color[3]);
                } else if (grandChildren[u].nodeName == "emissive") {
                    color = this.parseColor(grandChildren[u], "Color ERROR");
                    this.materials[materialID].setEmission(color[0], color[1], color[2], color[3]);
                } else if (grandChildren[u].nodeName == "shininess") {
                    let sh = this.reader.getFloat(grandChildren[u], "value");
                    if (sh == null) {
                        this.onXMLMinorError("Shininess value of material '" + materialID + "' is not defined")
                    }
                    this.materials[materialID].setShininess();

                }
            }
        }
        return null;
    }

    /**
     * Parses the <nodes> block.
     * @param {nodes block element} nodesNode
     */
    parseNodes(nodesNode) {
        let children = nodesNode.children;

        let grandChildren = [];
        let grandgrandChildren = [];
        let nodeNames = [];
        let descendants = [];

        // Any number of nodes.
        for (let i = 0; i < children.length; i++) {

            if (children[i].nodeName != "node") {
                this.onXMLMinorError("unknown tag <" + children[i].nodeName + ">");
                continue;
            }

            // Get id of the current node.
            let nodeID = this.reader.getString(children[i], 'id');
            if (nodeID == null)
                return "no ID defined for nodeID";

            // Checks for repeated IDs.
            if (this.nodes[nodeID] != null)
                return "ID must be unique for each node (conflict: ID = " + nodeID + ")";

            grandChildren = children[i].children;

            nodeNames = [];
            for (let j = 0; j < grandChildren.length; j++) {
                nodeNames.push(grandChildren[j].nodeName);
            }

            let transformationsIndex = nodeNames.indexOf("transformations");
            let materialIndex = nodeNames.indexOf("material");
            let textureIndex = nodeNames.indexOf("texture");
            descendants[nodeID] = nodeNames.indexOf("descendants");

            let tg;
            if (transformationsIndex < 0) {
                this.onXMLMinorError("Transformation block for '" + nodeID + "' not found!")
                tg = null;
            } else {
                tg = children[i].children[transformationsIndex];
            }
            let t;
            if (textureIndex < 0) {
                this.onXMLMinorError("Texture block for '" + nodeID + "' not found!")
                t = null;
            } else {
                t = children[i].children[textureIndex];
            }
            let m;
            if (materialIndex < 0) {
                this.onXMLMinorError("Material block for '" + nodeID + "' not found!")
                m = null;
            } else {
                m = children[i].children[materialIndex];
            }
            this.nodes[nodeID] = new MyNode(
                this.scene,
                tg,
                t,
                m
            );

        }
        for (let i = 0; i < children.length; i++) {

            if (children[i].nodeName != "node") {
                this.onXMLMinorError("unknown tag <" + children[i].nodeName + ">");
                continue;
            }

            // Get id of the current node.
            let nodeID = this.reader.getString(children[i], 'id');
            if (nodeID == null) {
                return "node not define";
            }
            grandChildren = children[i].children;

            nodeNames = [];
            for (let j = 0; j < grandChildren.length; j++) {
                nodeNames.push(grandChildren[j].nodeName);
            }

            if (this.nodes[nodeID].material != null) {
                let matID = this.reader.getString(this.nodes[nodeID].material, "id");
                if (matID != "null") {
                    this.nodes[nodeID].material = this.materials[matID];
                } else {
                    this.nodes[nodeID].material = null;
                }
            }



            let afs, aft;
            if (this.nodes[nodeID].texture != null) {
                afs = this.reader.getString(this.nodes[nodeID].texture.children[0], "afs");
                aft = this.reader.getString(this.nodes[nodeID].texture.children[0], "aft");

                let textureID = this.reader.getString(this.nodes[nodeID].texture, "id");
                if (textureID == "clear") {
                    this.nodes[nodeID].texture = "clear";
                } else if (textureID != "null") {
                    this.nodes[nodeID].texture = this.textures[textureID];
                } else {
                    this.nodes[nodeID].texture = null;
                }
            }
            if (this.nodes[nodeID].texture != "clear") {
                if (afs == null) {
                    afs = 1;
                    this.onXMLMinorError("Afs info is missing for the node '" + nodeID + "', setting to 1")
                }
                if (aft == null) {
                    aft = 1;
                    this.onXMLMinorError("Aft info is missing for the node '" + nodeID + "', setting to 1")
                }
            }



            let ddLenght;
            if (descendants[nodeID] == -1) {
                ddLenght = 0;
                this.onXMLError(nodeID + " does not have a descendants tag, some nodes may not be used");
            } else {
                ddLenght = grandChildren[descendants[nodeID]].children.length;
            }
            for (let j = 0; j < ddLenght; j++) {
                let grandgrandChildren = grandChildren[descendants[nodeID]].children[j];
                if (grandgrandChildren.nodeName == "noderef") {
                    let node = this.nodes[this.reader.getString(grandgrandChildren, 'id')];
                    if (node == null) {
                        node = new MyNode(this.scene, null, null, null);
                        this.onXMLError("Node '" + this.reader.getString(grandgrandChildren, 'id') + "' referenced but not created!")
                    }
                    this.nodes[nodeID].addDescendente(node);
                    node.used = true;
                } else {
                    this.auxiliaryParseLeaf(grandgrandChildren, nodeID, afs, aft);
                }
            }

            this.scene.loadIdentity();
            if (this.nodes[nodeID].tg_matrix != null) {
                for (let j = 0; j < this.nodes[nodeID].tg_matrix.children.length; j++) {
                    let grandgrandChildren = this.nodes[nodeID].tg_matrix.children[j];

                    switch (grandgrandChildren.nodeName) {
                        case "translation":
                            {
                                let position = this.parseCoordinates3D(grandgrandChildren, "");
                                this.scene.translate(position[0], position[1], position[2]);

                                break;
                            }
                        case "rotation":
                            {
                                let axis = this.reader.getString(grandgrandChildren, "axis");
                                let angle = this.reader.getFloat(grandgrandChildren, "angle");
                                angle = angle / 180 * Math.PI;
                                switch (axis) {
                                    case "x":
                                        {
                                            this.scene.rotate(angle, 1, 0, 0);
                                            break;
                                        }
                                    case "y":
                                        {
                                            this.scene.rotate(angle, 0, 1, 0);
                                            break;
                                        }
                                    case "z":
                                        {
                                            this.scene.rotate(angle, 0, 0, 1);
                                            break;
                                        }
                                    case "xx":
                                        {
                                            this.scene.rotate(angle, 1, 0, 0);
                                            break;
                                        }
                                    case "yy":
                                        {
                                            this.scene.rotate(angle, 0, 1, 0);
                                            break;
                                        }
                                    case "zz":
                                        {
                                            this.scene.rotate(angle, 0, 0, 1);
                                            break;
                                        }
                                }
                                break;
                            }
                        case "scale":
                            {
                                let sx = this.reader.getFloat(grandgrandChildren, "sx");
                                let sy = this.reader.getFloat(grandgrandChildren, "sy");
                                let sz = this.reader.getFloat(grandgrandChildren, "sz");

                                this.scene.scale(sx, sy, sz);

                                break;
                            }
                    }
                }
            }
            this.nodes[nodeID].tg_matrix = this.scene.getMatrix();
        }
        for (let node in this.nodes) {
            if (this.nodes[node].used == false && node != this.idRoot) {
                this.onXMLError("Node '" + node + "' created but not referenced!")
            }
        }
        this.rootNode = this.nodes[this.idRoot];
    }
    auxiliaryParseLeaf(leaf, nodeID, aft, afs) {
        switch (this.reader.getString(leaf, 'type')) {
            case "triangle":
                {
                    let x1 = this.reader.getFloat(leaf, 'x1');
                    let x2 = this.reader.getFloat(leaf, 'x2');
                    let x3 = this.reader.getFloat(leaf, 'x3');
                    let y1 = this.reader.getFloat(leaf, 'y1');
                    let y2 = this.reader.getFloat(leaf, 'y2');
                    let y3 = this.reader.getFloat(leaf, 'y3');
                    let t = new MyTriangle(this.scene, x1, y1, x2, y2, x3, y3, aft, afs);
                    this.nodes[nodeID].addDescendente(t);
                    break;
                }
            case "rectangle":
                {
                    let x1 = this.reader.getFloat(leaf, 'x1');
                    let x2 = this.reader.getFloat(leaf, 'x2');
                    let y1 = this.reader.getFloat(leaf, 'y1');
                    let y2 = this.reader.getFloat(leaf, 'y2');
                    let r = new MyRectangle(this.scene, x1, y1, x2, y2, aft, afs);
                    this.nodes[nodeID].addDescendente(r);
                    break;
                }
            case "cylinder":
                {
                    let height = this.reader.getFloat(leaf, 'height');
                    let topRadius = this.reader.getFloat(leaf, 'topRadius');
                    let bottomRadius = this.reader.getFloat(leaf, 'bottomRadius');
                    let stacks = this.reader.getFloat(leaf, 'stacks');
                    let slices = this.reader.getFloat(leaf, 'slices');
                    this.nodes[nodeID].addDescendente(new MyCylinder(this.scene, bottomRadius, topRadius, height, slices, stacks));
                    break;
                }
            case "sphere":
                {
                    let radius = this.reader.getFloat(leaf, 'radius');
                    let stacks = this.reader.getFloat(leaf, 'stacks');
                    let slices = this.reader.getFloat(leaf, 'slices');
                    this.nodes[nodeID].addDescendente(new MySphere(this.scene, radius, slices, stacks));
                    break;
                }
            case "torus":
                {
                    let inner = this.reader.getFloat(leaf, 'inner');
                    let outer = this.reader.getFloat(leaf, 'outer');
                    let slices = this.reader.getFloat(leaf, 'slices');
                    let loops = this.reader.getFloat(leaf, 'loops');
                    this.nodes[nodeID].addDescendente(new MyTorus(this.scene, inner, outer, slices, loops));
                }
        }
    }

    parseBoolean(node, name, messageError) {
            let boolVal = this.reader.getBoolean(node, name);
            if (!(boolVal != null && !isNaN(boolVal) && (boolVal == true || boolVal == false))) {
                this.onXMLMinorError(
                    "unable to parse value component " +
                    messageError +
                    "; assuming 'value = 1'"
                );
                return true;
            }


            return boolVal;

        }
        /**
         * Parse the coordinates from a node with ID = id
         * @param {block element} node
         * @param {message to be displayed in case of error} messageError
         */
    parseCoordinates3D(node, messageError) {
        let position = [];

        // x
        let x = this.reader.getFloat(node, 'x');
        if (x == null) {
            x = 0;
            this.onXMLError(messageError + " 'x' value set to 0");
        }
        if (!(x != null && !isNaN(x)))
            return "unable to parse x-coordinate of the " + messageError;

        // y
        let y;
        y = this.reader.getFloat(node, 'y');
        if (y == null) {
            y = 0;
            this.onXMLError(messageError + " 'y' value set to 0");
        }

        if (!(y != null && !isNaN(y)))
            return "unable to parse y-coordinate of the " + messageError;

        // z
        let z = this.reader.getFloat(node, 'z');
        if (z == null) {
            z = 0;
            this.onXMLError(messageError + " 'z' value set to 0");
        }
        if (!(z != null && !isNaN(z)))
            return "unable to parse z-coordinate of the " + messageError;

        position.push(...[x, y, z]);

        return position;
    }

    /**
     * Parse the coordinates from a node with ID = id
     * @param {block element} node
     * @param {message to be displayed in case of error} messageError
     */
    parseCoordinates4D(node, messageError) {
        let position = [];

        //Get x, y, z
        position = this.parseCoordinates3D(node, messageError);

        if (!Array.isArray(position))
            return position;


        // w
        let w = this.reader.getFloat(node, 'w');
        if (w == null) {
            w = 0;
            this.onXMLError(messageError + " 'w' value set to 0");
        }
        if (!(w != null && !isNaN(w)))
            return "unable to parse w-coordinate of the " + messageError;

        position.push(w);

        return position;
    }

    /**
     * Parse the color components from a node
     * @param {block element} node
     * @param {message to be displayed in case of error} messageError
     */
    parseColor(node, messageError) {
        let color = [];

        // R
        let r = this.reader.getFloat(node, 'r');
        if (r == null) {
            r = 0;
            this.onXMLError(messageError + " 'r' value set to 0");
        }
        if (!(r != null && !isNaN(r) && r >= 0 && r <= 1))
            return "unable to parse R component of the " + messageError;

        // G
        let g = this.reader.getFloat(node, 'g');
        if (g == null) {
            g = 0;
            this.onXMLError(messageError + " 'g' value set to 0");
        }
        if (!(g != null && !isNaN(g) && g >= 0 && g <= 1))
            return "unable to parse G component of the " + messageError;

        // B
        let b = this.reader.getFloat(node, 'b');
        if (b == null) {
            b = 0;
            this.onXMLError(messageError + " 'b' value set to 0");
        }
        if (!(b != null && !isNaN(b) && b >= 0 && b <= 1))
            return "unable to parse B component of the " + messageError;

        // A
        let a = this.reader.getFloat(node, 'a');
        if (a == null) {
            a = 0;
            this.onXMLError(messageError + " 'a' value set to 0");
        }
        if (!(a != null && !isNaN(a) && a >= 0 && a <= 1))
            return "unable to parse A component of the " + messageError;

        color.push(...[r, g, b, a]);

        return color;
    }

    /**
     * Displays the scene, processing each node, starting in the root node.
     */
    displayScene() {

        //To do: Create display loop for transversing the scene graph, calling the root node's display function

        //this.nodes[this.idRoot].display()
    }
}

function checkFileExist(url) {
    let http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    if (http.status === 200) {
        return true;
    } else {
        this.onXMLMinorError("File '" + url + "' doesn't exists");
        return false
    }
}