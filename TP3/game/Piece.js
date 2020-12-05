
class Piece{
    constructor(scene, nodeID, centerX, centerZ, objectID) {
        this.scene=scene;
        this.nodeID=nodeID;
        this.centerX=centerX;
        this.centerZ=centerZ;
        this.objectID=objectID;
        this.picked=false;
        
    }

    loadTextures(){
        this.XMLnode=this.scene.graph.nodes[this.nodeID];
    }
    
    display(){
        this.scene.registerForPick(this.objectID,this);
        this.scene.pushMatrix();
        this.scene.translate(this.centerX,0,this.centerZ);
        this.scene.rotate(Math.PI/2,1,0,0);
        this.XMLnode.display();
        this.scene.popMatrix();
    }
}