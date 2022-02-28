import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';



const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});

if (params.address) {
    var address = `http://${params.address}`;
} else {
    var address = window.location.href.replace(/\/+$/, "");
}


console.log(params.address);

class DeadCell extends React.Component {
    render() {
        return (<td className="dead_cell"
            key={this.props.i + "/" + this.props.j} >
            <div>&nbsp;</div>
        </td >)
    }
}

class EmptyCell extends React.Component {
    render() {
        return (<td className="empty_cell" key={this.props.i + "/" + this.props.j}>
            <div>&nbsp;</div>
        </td>)
    }
}


function heatMapColorforValue(value) {
    value = Math.max(0, Math.min(value, 1));
    let h = (1.0 - value) * 240;
    return "hsl(" + h + ", 100%, 50%)";
}

class Organism extends React.Component {
    render() {

        let factor = this.props.data.energy / 400;

        let cell_style = {
            "backgroundColor": heatMapColorforValue(factor),
        }

        //{this.props.data.energy},{this.props.data.minerals}

        return (<td className="organism" key={this.props.i + "/" + this.props.j} style={cell_style} onClick={
            () => {
                window.open(`${address}/inspect/${this.props.i}/${this.props.j}`, "_blank")
            }
        }>
            <div>&nbsp;</div>
        </td>)
    }
}



class Map extends React.Component {

    render() {

        let rows =
            this.props.cells.map((row, i) => {

                return (<tr key={i + "_row"}>{row.map((cell, j) => {

                    if (cell == "Empty") {
                        return <EmptyCell i={i} j={j} key={"cell " + i + " " + j} />;
                    } else if ("Alive" in cell) {
                        return <Organism data={cell.Alive} i={i} j={j} key={"cell " + i + " " + j} />;
                    } else if ("Dead" in cell) {
                        return <DeadCell data={cell.Dead} i={i} j={j} key={"cell " + i + " " + j} />;
                    }
                })}</tr>);
            });


        let table = <table key="map">
            <tbody>
                {rows}
            </tbody>
        </table>;

        return table;
    }
}

class AutoButton extends React.Component {
    render() {
        return <button onClick={
            () => {

                fetch(`${address}/stats`)
                    .then(response => response.json())
                    .then(stats => {
                        if (stats.is_paused == "0") {
                            shouldTick = true;
                        } else {
                            shouldTick = false;
                        }

                        fetch(`${address}/pause`, { method: "POST" })
                    })
            }
        }>Sync/Unsync</button>
    }
}

class SpawnMenu extends React.Component {
    render() {
        return <div className="dropdown">
            <button className="dropbtn">Spawn</button>
            <div className="dropdown-content">
                <a onClick={() => {
                    fetch(`${address}/spawn-green`, {
                        method: "POST",
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: "20"
                    })
                }}>Spawn green</a>
                <a onClick={() => {
                    fetch(`${address}/spawn-random`, {
                        method: "POST",
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: "20"
                    })
                }}>Spawn random</a>
            </div>
        </div >
    }
}

class PauseButton extends React.Component {
    render() {
        return <button onClick={
            () => {

                fetch(`${address}/pause`, {
                    method: "POST",
                });

            }
        }>Pause</button>
    }
}

class Controls extends React.Component {
    render() {
        return <div style={
            {
                flexGrow: 1
            }
        }>
            <AutoButton />
            <SpawnMenu />
            <PauseButton />
        </div>
    }
}

class Application extends React.Component {

    render() {
        return (
            <div style={
                {
                    display: "flex"
                }
            }>
                <Map cells={this.props.data.cells} />
                <Controls />
            </div>

        );
    }
}



var shouldTick = true;

function tick() {

    function draw_world(response) {
        response.then(response => response.json()).then(
            data => {
                ReactDOM.render(
                    <Application data={data} />,
                    document.getElementById('root')
                );
            });
    }

    if (shouldTick) {
        draw_world(fetch(`${address}/tick`, { method: "POST" }));
    } else {
        draw_world(fetch(`${address}/world`));
    }

    if (shouldTick) {
        requestAnimationFrame(tick)
    } else {
        setTimeout(() => requestAnimationFrame(tick), 500)
    }

}

fetch(`${address}/stats`)
    .then(response => response.json())
    .then(
        stats => {
            if (stats.is_paused == "0") {
                fetch(`${address}/pause`, { method: "POST" })
            }
        }
    );

tick()
