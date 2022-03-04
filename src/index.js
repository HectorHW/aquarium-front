import React, { useState } from 'react';
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

        let factor = this.props.data.energy / 500;

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


        let table = <table key="map" className="field-table">
            <tbody>
                {rows}
            </tbody>
        </table>;

        return table;
    }
}

class AutoButton extends React.Component {
    render() {

        let button_text = is_sync ? "Synced" : "Unsynced";

        return <button className="title-button"
            onClick={
                () => {
                    is_sync = !is_sync;
                    fetch(`${address}/stats`)
                        .then(response => response.json())
                        .then(stats => {

                            if (is_sync) {
                                if (stats.is_paused == "0") {
                                    fetch(`${address}/pause`, { method: "POST" });
                                }
                            } else {
                                if (is_paused != (stats.is_paused == "1")) {
                                    fetch(`${address}/pause`, { method: "POST" });
                                }
                            }
                        })
                }
            }> {button_text} </button>
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

        let button_text;
        if (is_paused) {
            button_text = "Paused";
        } else {
            button_text = "Unpaused";
        }

        return <button className="title-button"
            onClick={
                () => {
                    if (is_sync) {
                        is_paused = !is_paused;
                    } else {
                        fetch(`${address}/pause`, {
                            method: "POST",
                        }).then((response) => {
                            is_paused = response.headers.get('pause-state') === "1";
                        });
                    }


                }
            }>{button_text}</button>
    }
}

class ResetButton extends React.Component {
    render() {
        return <button className="title-button"
            onClick={
                () => {
                    fetch(`${address}/reset`, {
                        "method": "POST"
                    })
                }
            }>Reset</button>
    }
}


class LoadButton extends React.Component {

    constructor(props) {
        super(props);
        let reader = new FileReader();

        function upload_file(e) {
            let content = reader.result;

            fetch(`${address}/load-world`,
                {
                    method: "POST",
                    body: content,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                }).catch(e => console.error("failed upload:", e))
        }

        reader.onloadend = upload_file;

        this.state = { reader: reader, inputOpenFileRef: React.createRef() };
    }

    showOpenFileDialog = () => {
        this.state.inputOpenFileRef.current.click()
    }


    render() {
        return <div>
            <input
                type="file"
                id="file"
                onChange={
                    (event) => {
                        let file = event.target.files[0];
                        if (!file) {
                            return;
                        }

                        this.state.reader.readAsText(file);
                        event.target.value = null;
                    }
                }
                ref={this.state.inputOpenFileRef}
                style={{ display: 'none' }}
            />
            <button className="title-button"
                onClick={
                    this.showOpenFileDialog
                }>Load</button>
        </div>
    }
}

class SaveButton extends React.Component {
    render() {
        return <button
            className='title-button'
            onClick={() => {
                fetch(`${address}/save-world`).then(content => content.json()).then(data => {
                    let a = document.createElement("a");
                    a.href = window.URL.createObjectURL(new Blob([JSON.stringify(data)]), { type: "text/plain" });
                    a.download = "world.json";
                    a.click();
                })

            }}
        >Save</button>
    }
}

class Header extends React.Component {
    render() {
        return <div className='top-panel'>
            <AutoButton />
            <PauseButton />
            <SpawnMenu />

            <ResetButton />
            <LoadButton />
            <SaveButton />
        </div>
    }
}

class Application extends React.Component {

    render() {
        return (
            <div>
                <Header />
                <Map cells={this.props.data.cells} />

            </div>

        );
    }
}

var is_sync = false;
var is_paused = false;

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

    if (is_sync && !is_paused) {
        draw_world(fetch(`${address}/tick`, { method: "POST" }));
        requestAnimationFrame(tick)
    } else {
        draw_world(fetch(`${address}/world`));
        setTimeout(() => requestAnimationFrame(tick), 500)
    }
}

fetch(`${address}/stats`)
    .then(response => response.json())
    .then(
        stats => {
            if (stats.is_paused == "0") {
                is_paused = false;
            } else {
                is_paused = true;
            }
        }
    );

tick()
