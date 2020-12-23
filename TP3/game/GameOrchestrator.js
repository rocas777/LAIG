class GameOrchestrator{
    constructor(scene){
        this.scene = scene;
        this.board = new Board(this.scene);
        this.gameSequence = new GameSequence();
        this.animator = new Animator(this);
        this.prologInterface = new PrologInterface(this);
        this.lastPicked = null;

        this.player0=null;
        this.player1=null;

        this.turnPlayer=null;

        this.gameState=null;
    }

    display(){
        this.board.display();
    }

    onGraphLoaded(){
        this.board.loadXMLNodes();

        this.player0 = new Player(this.board.P1pieces,10,5,playerType.HUMAN,0);
        this.player1 = new Player(this.board.P2pieces,5,10,playerType.HUMAN,1);
        this.turnPlayer=this.player0;
        this.turnPlayer.makePiecesSelectable(true);
        this.player1.makePiecesSelectable(false);

        this.prologInterface.setInitialState();
    }

    getGameSequence(){
        return this.gameSequence;
    }

    changeTurn(){
        if(this.turnPlayer==this.player0){
            this.turnPlayer=this.player1;
            this.player0.makePiecesSelectable(false);
        }
        else if(this.turnPlayer==this.player1){
            this.turnPlayer=this.player0;
            this.player1.makePiecesSelectable(false);
        }
        
        this.turnPlayer.makePiecesSelectable(true);

    }

    applyChangeToPiece(originalCol,originalLine,newCol,newLine){
        let originalTile = this.board.getTileFromCoordinate(parseInt(originalCol),parseInt(originalLine));
        let newTile = this.board.getTileFromCoordinate(parseInt(newCol),parseInt(newLine));

        this.board.movePiece(originalTile.getPiece(),originalTile,newTile);
    }

    applyPieceRemoval(originalCol,originalLine,color,type){
        let originalTile = this.board.getTileFromCoordinate(parseInt(originalCol),parseInt(originalLine));
        this.board.movePieceToCollectZone(originalTile,color,type);
    }
    
	managePick(mode,results) {
		if (mode == false) {
			if (results != null && results.length > 0) {
				for (var i = 0; i < results.length; i++) {
					var obj = results[i][0];
					if (obj) {
                        var customId = results[i][1];
                        this.onObjectSelected(obj,customId);
					}
				}
				this.scene.pickResults.splice(0, this.scene.pickResults.length);
			}
		}
    }

    onObjectSelected(obj, id){
        console.log("Picked object: " + obj + ", with pick id " + id);
        if(obj instanceof BoardTile){
            if(this.lastPicked instanceof Piece && obj.getPiece()==null){
                this.board.movePieceToBoard(this.lastPicked,obj);
                this.turnPlayer.changeUnused(this.lastPicked);
                this.prologInterface.makeMove(this.gameState,obj.getPrologTargetForMove());
                //console.log(this.generateGameState());

                this.changeTurn();
            }
            this.lastPicked=obj;
        }
        else if(obj instanceof Piece){
            this.lastPicked=obj;
        }
        else{
            //nothing happens
        }
    }

    generateGameState(){
        return [this.board.buildBoardString(),
            [this.player0.getRedPieces(),this.player0.getBluePieces(),this.player1.getRedPieces(),this.player1.getBluePieces()],
            [this.player0.getBonusPieces(),this.player1.getBonusPieces(),this.player0.getRiskPieces(),this.player1.getRiskPieces()],
            [this.turnPlayer.getPlayer()]
        ];

    }
}

const playerType = {
    HUMAN : 0,
    AI : 1
}