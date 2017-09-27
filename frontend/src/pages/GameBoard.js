import React from 'react';
import { observer, inject } from 'mobx-react';
import $ from 'jquery';
import 'jquery.scrollto';
import Board from '../Board';
import ethUtils from '../EthereumUtils';

@inject('game')
@observer
class GameBoard extends React.Component {
  componentDidMount() {
    this.game = this.props.game;

    // $('#helpButton').click(() => alert('tadaaaaaa'));
    if(ethUtils.needsUnlock()) {
      $('#unlockWalletLayer').addClass('visible');
      $('.joinGameWrapper').slideUp(350);
      // $('.joinGameFirstInfotext').slideUp(350);   
    } else {
      $('#unlockWalletLayer').removeClass('visible');
      $('.joinGameWrapper').slideDown(350);
      // $('.joinGameFirstInfotext').slideDown(350);   
    }

    // Navigation Mobile
    $('.navTrigger .showButton').click(function(){
      $(this).slideUp(250).parent().find('.hideButton').slideDown(250);
      $('header nav').slideDown(500);
    });

    $('.navTrigger .hideButton').click(function(){
      $(this).slideUp(250).parent().find('.showButton').slideDown(250);
      $('header nav').slideUp(500);
    });

    $('header nav a').click(function(){
      $('.navTrigger .hideButton').slideUp(250);
      $('.navTrigger .showButton').slideDown(250);
      $('header nav').fadeOut(200);
    });

    $('#linkWallet').click(() => {
      const pass = document.getElementsByName("linkWalletPassword")[0].value;
      if(ethUtils.unlockWallet(pass) === null){
        //alert("wrong password. ")
        
        $('#unlockWalletLayer .errorMessage').slideDown(350);
        $('.joinGameWrapper').slideUp(350);
        // $('.joinGameFirstInfotext').slideUp(350);   

        
        $('.button#createNewWallet').click( () => {
          
          $('#unlockWalletLayer .errorMessage').slideUp(350);
          $('#unlockWalletLayer .unlockInfoMessage').slideUp(350);
          $('#unlockWalletLayer .formWrapper').slideUp(350);
          $('#unlockWalletLayer .newWalletCreatedMessage').slideDown(350);
          $('.joinGameWrapper').slideDown(350);
          // $('.joinGameFirstInfotext').slideDown(350);   
          
          
          ethUtils.createNewWallet();
          this.game.id = ethUtils.getAddress(); 
          // TODO: this is not elegant
          // $('#unlockWalletLayer').removeClass('visible');
        
        });
        
        // if(window.confirm("Wrong password. If you want to try again, click cancel. Click ok to create a new account.\nTODO: prettify this!")) {
        // }
      } else {
        $('#unlockWalletLayer').removeClass('visible');
        $('.joinGameWrapper').slideDown(350);

      }
    });

    // Button ScrollTo Layer / Top
    $('.button').click(function(){
      $.scrollTo(0, 250);
    });

    $('.joinGameFirstInfotext').click(function(){
      $.scrollTo(".joinGameWrapper", 250, {offset:-50});
    });


    // Show Layers 	  
    $('#helpButton').click(function(){
      $('.layer#helpLayer').addClass('showLayer');
    });



    // Hide Layer
    $('.closeLayerButton').click(function(){
      $(this).parent().removeClass('showLayer');
    });






    // Refresh LiveCam Feed
    var liveCamPhoto = document.getElementById("liveFeedImage");
    function updateImage() {
      liveCamPhoto.src = liveCamPhoto.src.split("?")[0] + "?" + new Date().getTime();
    }

    setInterval(updateImage, 1000);




  }

  render() {
    const game = this.props.game;

    const timeBarStyleGame = {
      width: game.percentageLeftinGame,
    };

    const timeBarStyleRound = {
      width: game.percentageLeftinRound,
    };

    return (
      <div>
        <div className={`layer ${game.myTeam ? '' : 'showLayer'}`} id='startGame'>
          <div className='layerInner'>
            <h2>How does it work?</h2>

            <div className="c50l">
              <p>You can join the current 'Go' game <br className="desktopOnly" />at any point of time. <br />The rules are easy to learn! </p>
              <span className='button' id='helpButton'>Rules of the game</span>
              <p>When you join, you will be assigned <br className="desktopOnly" />to one of the two teams (black, white). </p>
 
            </div>
            <div className="c50r">
             <p>Every valid move you make will serve as proof-of-PLAY and mine (generate) two tokens:</p>
              <ul>
                <li>The first token is your reward for playing</li>
                <li>The second (supplementary) token will be donated to a charity.</li>
              </ul>
              <p>The game automatically ends after 30 minutes. However, you can leave the game any time you wish</p>
              <p>In either case, you can redeem your tokens:</p>
              <ul>
                <li>Send the tokens to an existing wallet.</li>
                <li>Create a new wallet and transfer the tokens to this new created wallet</li>
              </ul>
              
              {/* 
              <h3>Optional:</h3>
              <p>If you want, you can enter a 3-letter name to be displayed on our leader board:</p>
              <div className="formWrapper">
                <input name='username' type='text' className='text leaderboardDigits' placeholder='Enter 3 Digits' />
                <input type='submit' value='Save' className='submit' />
              </div>
              */}
            </div>
            <div className="clear"></div>
            <hr />
              
            <div id='unlockWalletLayer'>
              <div className="unlockInner">
                {/*<p><strong>### DEV-INFO: IF WALLET FOUND, BUT NOT LINKED YET###</strong></p> */}
                <p className="unlockInfoMessage"><strong>Please enter your wallet password to start the game.</strong> <br />Your mined PLAY Tokens can be transfered to this wallet after proof-of-play </p>
                

                <div className="formWrapper">
                  <input name='linkWalletPassword' type='password' className='text' placeholder='Your Wallet-Password' />
                  <input type='submit' value='OK' className='submit' id='linkWallet' />
                </div>
                
                <p className="errorMessage">
                  Wrong password - please try again. <br />
                  <span className="button" id="createNewWallet">or create a new wallet</span>
                </p>

                <p className="newWalletCreatedMessage">
                  <strong>Your new wallet has been created!</strong><br />
                  You can start playing by clicking the button below.
                </p>


                
              </div>
            </div>
            
            {/* <p><strong>### DEV-INFO: IF WALLET IS ALREADY LINKED OR NO WALLET FOUND###</strong></p> */}
            <p className={`joinGameWrapper  ${game.paused ? 'gamePaused' : ''}`}>
              Ready? Good!<br />
              <span className='button' onClick={game.joinGame} id='joinGameButton'>
                JOIN GAME NOW
              </span>
            </p>


          </div>
        </div>

        <div className={`field  ${game.paused ? 'gamePaused' : ''}`} id='gameField'>
          <div className='fieldInner'>
            
            <div className={`boardWrapper ${game.formattedMyTeam || '--'}`}>
            <Board />
            </div>

            <div className="pausedStatusMsg">
              <p>The Game is currently paused.<br />Please check back between 7pm to 10pm CEST.</p>

              <p className={`redeemTokensButtonIfGamePaused ${game.earnedTokens > 0 ? '' : 'item hide'}`}>
                <a className='button' id='stopGame' href='endgame'>The game is currently paused. If you still have Tokens to redeem - click here!</a>
              </p>  
               
            </div>
            <div className={`gameInfo ${game.myTeamActive ? 'yourTeam' : 'otherTeam'}`}>
              <h2>Player info: </h2>




              <div className={`infoBox  ${game.myTeam ? '' : 'joinGameFirst'}`}>
                <div className={`item placeStatus ${game.myTeamActive ? 'yourTeam' : 'otherTeam'}`}>
                  <p className="yourTeamInfotext">Your turn! Place your Stone!</p>
                  <p className="otherTeamInfotext">Wait until the other team placed their stone!</p>
                  <p className="joinGameFirstInfotext">Join the game first!</p>
                  <p className="waitForNextGame">Wait for next game to start!</p>
                </div>
              </div>



              <div className={`item ${game.myTeam ? '' : 'hideItem'}`}>
                <span className='label'>Your team:</span>
                <span className='value' id='yourTeam'>{game.formattedMyTeam || '--'}</span>
              </div>
              <div className={`item ${game.myTeam ? '' : 'hideItem'}`}>
                <span className='label'>Placed on</span>
                <span className='value' id='placedOn'>{game.formattedMove || '--'}</span>
              </div>
              <div className={`item ${game.myTeam ? '' : 'hideItem'}`}>
                <span className='label'>Time to vote</span>
                <span className='value' id='timeToVote'>
                  {game.gameState ? `${game.timeLeftInRound.getSeconds()}s` : '--'}
                </span>
                <div className='timeLeftInRound'>
                  <span className='timeBar' style={timeBarStyleRound} />
                </div>
              </div>





              <h2>Current game info:</h2>
              <div className='item'>
                <span className='label'>Active Team</span>
                <span className='value' id='activeTeam'>
                  {game.gameState ? game.formattedCurrentTeam : '--'}
                </span>
              </div>
              <div className={`item ${game.myTeam ? '' : 'hideItem'}`}>
                <span className='label'>Players on your team</span>
                <span className='value' id='yourTeamSize'>
                  {game.currentTeamPlayers}
                </span>
              </div>
              <div className='item'>
                <span className='label'>Players total</span>
                <span className='value' id='totalPlayers'>
                  {game.blackPlayers + game.whitePlayers}
                </span>
              </div>
              <div className='item'>
                <span className='label'>Time to complete current game</span>
                <span className='value' id='gameclock'>
                  {game.gameState ? '' : 'Next game starts in: '}
                  {game.gameState ?
                    game.timeLeftInGame.getMinutes() : game.timeLeftInPause.getMinutes()}m
                  &nbsp;
                  {game.gameState ?
                    game.timeLeftInGame.getSeconds() : game.timeLeftInPause.getSeconds()}s
                </span>
                <div className='timeLeftInGame'>
                  <span className='timeBar' style={timeBarStyleGame} />
                </div>
              </div>

              <h2>Tokens:</h2>
              <div className='item'>
                <span className='label'>PLAY tokens earned so far:</span>
                <span className='value' id='yourTokens'>{game.earnedTokens} Token</span>
              </div>

              <p className={`item ${game.myTeam ? '' : 'hideItem'}`}>
                <a className='button' id='stopGame' href='endgame'>Leave game, redeem your tokens</a>
              </p>

            </div>
 


            <div className='liveCam clear'>
              <img id="liveFeedImage" src='https://play.lab10.coop/bixcam' alt='bix Livecam' />
            </div>
          </div>
        </div>

        <div className='layer' id='helpLayer'>
          <div className='layerInner'>

            <h2>Happy to help :)</h2>

            <h3>To play the game you simply:</h3>
            <ul className="numbered">
              <li>Click join game</li>
              <li>You get randomly assigned to a team</li>
              <li>You can begin playing GO</li>
              <li>You have 20 sec to pick a move</li>
              <li>The majority move of your team is picked and executed</li>
              <li>The team that has the ---- at the end of the max play time of 30 min wins</li>
            </ul>

            <hr />

            <h3>How to play GO</h3>
            <p>To play GO you need to know the basic rules. <br />
              Check out the <a href="https://senseis.xmp.net/?BasicRulesOfGo" target="_blank" title="Simple GO Rules at senseis.xmp.net">simple rules here</a> or dive a little deeper with the <a href="http://gobase.org/studying/rules/doc/a4.pdf" target="_blank" title="Advanced GO Rules at gobase.org">advanced rules here.</a>
            </p>

            <hr />

            <h3>PLAY Token</h3>
            <ul className="numbered">
              <li>You simply play the game</li>
              <li>Every legal move you pick will serve as proof-of-play</li>
              <li>2 PLAY token will be mined – one of those will be awarded to you – the second one serves as a complimentary token that will be donated for charity purpose</li>
              <li>At the end of the game the tokens will be sent to your wallet (if you already have one linked) or you can simply create a new wallet.</li>
            </ul>

            <hr />

            <p>Still things unclear? <a href="mailto:play@lab10.coop">Contact us</a></p>
          </div>
          <div className="closeLayerButton"></div>
        </div>


      </div>
    );
  }
}

export default GameBoard;
