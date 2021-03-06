/*!
 * Copyright (c) 2017 David Forstenlechner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
 * to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import React from 'react';
import { Route, Switch, Link } from 'react-router-dom';
import Home from './pages/Home';
import FAQ from './pages/FAQ';
import Imprint from './pages/Imprint';
import Credits from './pages/Credits';
import GameBoard from './pages/GameBoard';
import EndGame from './pages/EndGame';

function Navigation() {
  return (
    <header>
      <div className='inner'>
        <div className='logo'>Play for Privacy</div>
        <nav>
          <ul>
            <li><Link to='/'>Home</Link></li>
            <li><Link to='/gameboard'>Gameboard</Link></li>
            <li><Link to='/faq'>FAQ</Link></li>
            <li><a href="http://p4p.games" target="_blank" rel="noopener noreferrer" title="About play4privacy">About</a></li>
            <li><Link to='/imprint'>Imprint</Link></li>
          </ul>
        </nav>
        <div className="navTrigger phonesOnly">
          <div className="showButton">Show Navigation</div>
          <div className="hideButton">Hide Navigation</div>
        </div>
        <div className='clear' />
      </div>
    </header>
  );
}

function App() {
  return (
    <div>
      <Navigation />
      <Switch>
        <Route path='/faq' component={FAQ} />
        <Route path='/imprint' component={Imprint} />
        <Route path='/credits' component={Credits} />
        <Route path='/gameboard' component={GameBoard} />
        <Route path='/endgame' component={EndGame} />
        <Route path='/' component={Home} />
      </Switch>
    </div>
  );
}

export default App;
