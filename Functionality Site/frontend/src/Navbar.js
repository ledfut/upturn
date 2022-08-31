import { Link, useMatch, useResolvedPath } from "react-router-dom";
import { Button } from "react-bootstrap";
import { ethers } from "ethers";
import { useState } from 'react';

export let connectedAddress;
export let isWalletConnected;

function NavBar() {
    const [walletAddress, setWalletAddress] = useState("");
    async function requestAccount() {
        if (window.ethereum) {
            console.log('detected');

            try {
                const accounts = await window.ethereum.request({
                    method: "eth_requestAccounts",
            });
            setWalletAddress(accounts[0]);
            connectedAddress = accounts[0]
            isWalletConnected = Boolean(accounts[0])
            connectWallet = accounts[0];
            console.log("account: " + accounts[0])

        } catch (error) {
            console.log("error account request");
        }

        } else {
            alert("Meta mask not deteched");
        }
    }

    async function connectWallet() {
        if(typeof window.ethereum !== "undefined") {
            await requestAccount();

            const provider = new ethers.providers.Web3Provider(window.ethereum);
        }
    }

    return (
        <nav className="nav">
            <Link to="/" className="site-title">
                UP.TURN
            </Link>
            <ul>
                {isWalletConnected ? (
                    <h6>Connected</h6>
                ) : (
                    <Button 
                    onClick={connectWallet}>Connect Wallet</Button>
                )}
            </ul>
        </nav>
        )


    function CustomLink({ to, children, ...props }) {
        const resolvedPath = useResolvedPath(to)
        const isActive = useMatch({ path: resolvedPath.pathname, end: true })
        return (
            <li className={isActive ? "active" : ""}>
                <Link to={to} {...props}>{children}</Link>
            </li>
        )

    }

}
export default NavBar;