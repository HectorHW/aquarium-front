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

class Organism extends React.Component {
    render() {

        function compute_transition(value1, value2, factor) {
            return value1 * factor + value2 * (1 - factor);
        }



        let factor = this.props.data.energy / 400;

        let base = [72, 72, 72];
        let orange = [255, 240, 17];

        let color = [
            compute_transition(orange[0], base[0], factor),
            compute_transition(orange[1], base[1], factor),
            compute_transition(orange[2], base[2], factor)];

        let cell_style = {
            "backgroundColor": `rgb(${color[0]},${color[1]},${color[2]} )`,
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

class Controls extends React.Component {
    render() {
        return <div style={
            {
                flexGrow: 1
            }
        }>
            <AutoButton />
            <SpawnMenu />
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

    if (shouldTick) {
        fetch(`${address}/tick`, { method: "POST" });
    }


    fetch(`${address}/world`)
        .then(response => {
            return response.json();
        })
        .then(data => {
            ReactDOM.render(
                <Application data={data} />,
                document.getElementById('root')
            );
        });

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
