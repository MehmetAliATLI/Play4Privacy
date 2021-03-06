import { observable, computed, action } from 'mobx';
import gs from './GameSettings';
import ethUtils from './EthereumUtils';
import Averager from './utilities/AddAndAverage';

class Game {
  constructor(socket) {
    if (gs.inDebugMode()) {
      window.game = this;
      window.gameSettings = gs;
    }
    // User id. note that this can initially be unknown in case there's a locked wallet.
    // Is updated to an actual id once the user unlocked the wallet or agreed to create a new one.
    this.id = ethUtils.getAddress() || 'anonymous';
    this.gameId = 0;
    this.socket = socket;
    this.maxGameDuration = new Date(gs.MAX_GAME_DURATION);
    this.gameState = gs.STOPPED;
    this.autojoin = false; // set true once the player clicked the join button
    this.roundTokenEarned = false; // set true per round if the server confirms a move
    this.placedMoves.fill(0);

    // ////////////////////////////////////////////////////////////////////////
    // Subscriptions to socket.io Events

    // Re-acquire the current game state on a re-connect
    socket.on('connect',
      () => {
        console.log('connected to game server');
        this.socket.emit('current game state', this.id, Date.now(), this.refreshGameState);
      });
    socket.on('reconnect',
      () => {
        console.log('reconnected to game server');
        // TODO this seems to be redundant with connect (also fired on connect, not only on reconnect)
        this.socket.emit('current game state', this.id, Date.now(), this.refreshGameState);
      });
    socket.on('disconnect',
      () => {
        console.log('disconnected from game server');
        this.gameState = gs.STOPPED;
      });
    socket.on('pong', (ms) => {
      this.latency.add(ms);
      console.log(`Latency measured by pong: ${ms}`);
      console.log(`Latency measured by Averager: ${this.latency.value()}`);
    });

    // Get notified when a new game started
    this.socket.on('game started', this.startGame);

    // Get notified when a new game started
    this.socket.on('game finished', this.finishGame);

    this.socket.on('game stopped', () => {
      this.gameState = gs.STOPPED;
    });

    // Get notified when a round finished
    socket.on('round finished', this.finishRound);

    // For continuous game changes
    this.socket.on('game updates', this.updateGame);

    // ////////////////////////////////////////////////////////////////////////    

    // Initialize the ticker to the current time in the browser
    // Note: local browser time may differ from the time sent by the server,
    //       we need to compensate for that fact.
    this.localTime = Date.now();
    // Triggers a refresh of time-dependent values once per second
    // by updating the "localTime" ticker, which itself is an observable
    // and will trigger events by functions using it if they are use
    // mobx's "@compute" decorator.
    setInterval(() => { this.localTime = Date.now(); }, 1000);
  }

  @action.bound
  startGame(gameId, currentTeam) {
    this.gameId = gameId;
    this.gameState = gs.RUNNING;
    this.setGameState(0, currentTeam, gs.UNSET, '',
      new Array(gs.BOARD_SIZE_SQUARED).fill(gs.UNSET), gs.RUNNING);

    if (this.autojoin && window.location.pathname === '/gameboard') {
      this.joinGame(true);
    }
  }

  setGameState(elapsedTime, currentTeam, myTeam, myMove, boardState, gameState) {
    for (let i = 0; i < gs.BOARD_SIZE_SQUARED; i++) {
      this.squares[i] = boardState[i];
    }
    this.startTime = Date.now() - elapsedTime - this.latency.value();
    this.currentTeam = currentTeam;
    this.myTeam = myTeam;
    this.myMove = myMove;
    this.gameState = gameState;
  }

  @action.bound
  refreshGameState(gameId, clientTimeStamp, elapsedTime, currentTeam,
    myTeam, myMove, boardState, gameState, unclaimedTokens) {
    this.gameId = gameId;
    const ms = (Date.now() - clientTimeStamp) / 2.0;
    this.latency.add(ms);
    console.log(`Latency measured by Averager: ${ms}ms`);
    console.log(`Latency measured by refreshGameState: ${this.latency.value()}ms`);
    this.setGameState(elapsedTime, currentTeam, myTeam, myMove, boardState, gameState);
    this.overallUnclaimedTokens = unclaimedTokens;
  }

  // Utility function to clear stones marked as PLACED in the previous round.
  clearPlaced() {
    for (let i = 0; i < gs.BOARD_SIZE_SQUARED; i++) {
      if (this.squares[i] === gs.PLACED) {
        this.squares[i] = gs.UNSET;
      }
    }
  }

  @action.bound
  finishRound(nr, newTeam, move, captured) {
    this.roundNr = nr + 1; // point to the next round
    this.clearPlaced();
    this.placedMoves.fill(0);
    this.squares[move] = this.currentTeam;
    this.previousMove = move;
    this.currentTeam = newTeam;
    if (this.roundTokenEarned) {
      this.earnedTokens++;
      this.overallUnclaimedTokens++;
      this.roundTokenEarned = false; // reset
    }
    this.myMove = '';
    if (Array.isArray(captured)) {
      for (const piece of captured) {
        this.squares[piece] = gs.UNSET;
      }
    }
  }

  @action.bound
  finishGame(nrCapturedStones, nrValidMoves) {
    this.gameState = gs.PAUSED;
    this.startTime = Date.now();
    console.log(`finishGame with nrCapturedStones: ${JSON.stringify(nrCapturedStones)}, nrValidMoves: ${nrValidMoves}`);

    this.validMovesOverall = nrValidMoves;

    // example: [[1,2],[-1,5]] where 1/-1 is team id and the second number the nr of stones of that team captured
    this.blackStonesCaptured = nrCapturedStones.filter(e => e[0] === gs.BLACK)[0][1];
    this.whiteStonesCaptured = nrCapturedStones.filter(e => e[0] === gs.WHITE)[0][1];
  }

  @action.bound
  updateGame(numPlayers, placedMoves) {
    this.blackPlayers = numPlayers[0];
    this.whitePlayers = numPlayers[1];
    this.placedMoves = placedMoves;
  }

  // Averages the last 3 latency values to avoid spikes
  latency = new Averager(3);

  // Indicator for the move chosen in the previous round
  previousMove = -1;

  // Ticker triggering updates of time-dependent computations by the magic
  // of mobx functional-reactive programming.
  @observable localTime = 0;

  @observable startTime = 0;
  @observable currentTeam = gs.UNSET;
  @observable roundNr = 1;
  @observable myTeam = gs.UNSET;
  @observable myMove = '';
  @observable earnedTokens = 0; // earned during the currently running game
  @observable overallUnclaimedTokens = 0;
  @observable squares = new Array(gs.BOARD_SIZE_SQUARED).fill(gs.UNSET);
  @observable countSteps = 0;
  @observable blackPlayers = 0;
  @observable whitePlayers = 0;
  @observable gameState = gs.PAUSED;
  @observable validMovesOverall = 0;
  @observable placedMoves = new Array(gs.BOARD_SIZE_SQUARED);

  // Computes the time left in the current game
  // Returns a "Date" type for convenience of extraction of Minutes and Seconds.
  // Note: Relies on "this.localTime" to be changed periodically to automatically
  //       trigger updates in code that uses this function.
  @computed get timeLeftInGame() {
    const duration = Math.max(0, (gs.MAX_GAME_DURATION -
      (this.localTime - this.startTime)));
    return new Date(duration);
  }

  @computed get timeLeftInRound() {
    let duration = Math.max(0, (gs.MAX_GAME_DURATION -
      (this.localTime - this.startTime)));
    duration = Math.floor(duration % gs.ROUND_TIME);
    return new Date(duration);
  }

  @computed get timeLeftInPause() {
    const duration = Math.max(0, (gs.PAUSE_DURATION -
      (this.localTime - this.startTime)));
    return new Date(duration);
  }

  @computed get formattedMove() {
    if (this.myMove === '' || isNaN(this.myMove)) {
      return this.myMove;
    }
    return gs.idxToCoord(this.myMove);
  }

  @computed get formattedMyTeam() {
    return gs.teamToString(this.myTeam);
  }

  @computed get formattedCurrentTeam() {
    return gs.teamToString(this.currentTeam);
  }

  @computed get currentTeamPlayers() {
    if (this.myTeam === gs.BLACK) {
      return this.blackPlayers;
    } else if (this.myTeam === gs.WHITE) {
      return this.whitePlayers;
    }
    return '--';
  }

  @computed get percentageLeftinGame() {
    return `${((this.timeLeftInGame.getTime() / this.maxGameDuration.getTime()) * 100)}%`;
  }

  @computed get percentageLeftinRound() {
    return `${((this.timeLeftInRound.getTime() / gs.ROUND_TIME) * 100)}%`;
  }

  @computed get myTeamActive() {
    return this.myTeam === this.currentTeam;
  }

  @computed get paused() {
    return this.gameState === gs.PAUSED;
  }

  @computed get stopped() {
    return this.gameState === gs.STOPPED;
  }

  // this returns a correct value only after a game finished
  @computed get averageValidMovesPerRound() {
    // roundNr starts at 1 and is always incremented at the end of a round, thus need to decrement by 1 here
    // Rounding to 1 digit after the comma
    return (Math.round((this.validMovesOverall / (this.roundNr - 1)) * 10)) / 10;
  }

  @action.bound
  joinGame() {
    if (this.gameState !== gs.RUNNING) {
      return;
    }
    this.earnedTokens = 0;
    this.socket.emit('join game', this.id, (team, unclaimedTokens) => {
      if (team === 'blacklisted') {
        alert('You are blocked for the current game due to spamming');
      } else {
        this.myTeam = team;
        this.overallUnclaimedTokens = unclaimedTokens;
        this.autojoin = true;
      }
    });
  }

  @action.bound
  submitMove(move) {
    if (this.gameState !== gs.RUNNING) {
      return;
    }

    const sigData = `${this.gameId}_${this.roundNr}_${move}`;
    const sig = ethUtils.sign(sigData);

    this.socket.emit('submit move', this.id,
      this.roundNr, move, sig, (confirmedMove) => {
        if (confirmedMove !== '' && !isNaN(confirmedMove)) {
          this.roundTokenEarned = true;
        }
        this.myMove = confirmedMove;
        this.squares[confirmedMove] = gs.PLACED;
      });
  }
}

export default Game;
