import { Alchemy, Network } from "alchemy-sdk";
import ethereum from "../assets/ethereum.png";
import polygon from "../assets/polygon.png";
import arbitrum from "../assets/arbitrum.svg";
import optimism from "../assets/optimism.svg"
import { createContext, useState } from 'react'
import axios from "axios";

export const StateContext = createContext();

// eslint-disable-next-line react/prop-types
const Context = ({ children }) => {
    const APIs = {
        "eth-mainnet": {
            apikey: import.meta.env.VITE_ETHEREUM_MAINNET_KEY,
            network: Network.ETH_MAINNET,
            symbol: "ETH",
            scan: import.meta.env.VITE_ETH_SCAN,
            url: "api.etherscan.io",
            explorer: "https://etherscan.io/tx/",
            src: ethereum
        },
        "eth-goerli": {
            apikey: import.meta.env.VITE_ETHEREUM_GOERLI_KEY,
            network: Network.ETH_GOERLI,
            symbol: "ETH",
            scan: import.meta.env.VITE_ETH_SCAN,
            url: "api-goerli.etherscan.io",
            explorer: "https://goerli.etherscan.io/tx/",
            src: ethereum
        },
        "eth-sepolia": {
            apikey: import.meta.env.VITE_ETHEREUM_SEPOLIA_KEY,
            network: Network.ETH_SEPOLIA,
            symbol: "ETH",
            scan: import.meta.env.VITE_ETH_SCAN,
            url: "api-goerli.etherscan.io",
            explorer: "https://sepolia.etherscan.io/tx/",
            src: ethereum
        },
        "polygon-mainnet": {
            apikey: import.meta.env.VITE_POLYGON_MAINNET_KEY,
            network: Network.MATIC_MAINNET,
            symbol: "MATIC",
            scan: import.meta.env.VITE_POLYGON_SCAN,
            url: "api.polygonscan.com",
            explorer: "https://polygonscan.com/tx/",
            src: polygon
        },
        "polygon-mumbai": {
            apikey: import.meta.env.VITE_POLYGON_MUMBAI_KEY,
            network: Network.MATIC_MUMBAI,
            symbol: "MATIC",
            scan: import.meta.env.VITE_POLYGON_SCAN,
            url: "api-testnet.polygonscan.com",
            explorer: "https://mumbai.polygonscan.com/tx/",
            src: polygon
        },
        "arb-mainnet": {
            apiKey: import.meta.env.VITE_ARBITRUM_MAINNET_KEY,
            network: Network.ARB_MAINNET,
            symbol: "ETH",
            scan: import.meta.env.VITE_ARB_SCAN,
            url: "api.arbiscan.io",
            explorer: "https://arbiscan.io/tx/",
            src: arbitrum,
        },
        "arb-goerli": {
            apiKey: import.meta.env.VITE_ARBITRUM_GOERLI_KEY,
            network: Network.ARB_GOERLI,
            symbol: "ETH",
            scan: import.meta.env.VITE_ARB_SCAN,
            url: "api-goerli.arbiscan.io",
            explorer: "https://goerli.arbiscan.io/tx/",
            src: arbitrum,
        },
        "opt-mainnet": {
            apiKey: import.meta.env.VITE_OPTIMISM_MAINNET_KEY,
            network: Network.OPT_MAINNET,
            symbol: "OPT",
            scan: import.meta.env.VITE_OPT_SCAN,
            url: "api-optimistic.etherscan.io",
            explorer: "https://optimistic.etherscan.io/tx/",
            src: optimism,
        },
    }
    const [alchemyAPIkey, setAlchemyAPIkey] = useState(APIs["eth-mainnet"]);
    const [address, setAddress] = useState("");
    const [url, setUrl] = useState("");
    const alchemy = new Alchemy({
        apikey: alchemyAPIkey.apikey,
        network: alchemyAPIkey.network
    });
    const [accountsFound, setAccountsFound] = useState([]);
    const [accountDetails, setAccountDetails] = useState({});
    const [active, setActive] = useState("transactions");
    const [loading, setLoading] = useState(false);

    const formatCurrency = (val) => { 
        return (val / 10 ** 18).toFixed(2);
    };

    const formatTitle = (title) => {
        const start =
            title.split("-")[0].slice(0, 1).toUpperCase() +
            title.split("-")[0].slice(1);
        const end =
            title.split("-")[1].slice(0, 1).toUpperCase() +
            title.split("-")[1].slice(1);
        return String(start + " " + end);
    };

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            Promise.all(
                Object.values(APIs).map(async el => {
                    const setting = {
                        apikey: el.apiKey,
                        network: el.network
                    };
                    const al = new Alchemy(setting);
                    const balance = await al.core.getBalance(address);
                    const transaction = await al.core.getTransactionCount(address);
                    if (Number(balance) > 0 || Number(transaction) > 0) {
                        return [el.network, Number(balance), transaction, address];
                    }
                })
            ).then(data => {
                setAccountsFound(
                    data.filter(el => {
                        return el !== undefined;
                    })
                );
                setLoading(false);
            })
                .catch(e => console.log(e));
        } catch (error) {
            console.log(error);
        }
    }

    const fetchData = async () => {
        try {
            setLoading(true);
            const balance = formatCurrency(await alchemy.core.getBalance(address));
            const transactions = await axios.get(
                `https://${alchemyAPIkey.url}/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=1000&sort=asc&apikey=${alchemyAPIkey.scan}`,
                {}
            )
                .then(data => {
                    return data.data.result
                        .filter(el => el.from.length > 0 && el.to.length > 0)
                        .reverse();
                })
                .catch(e => console.log(e));

            const nftData = await alchemy.nft.getNftsForOwner(address);

            const tokens = await alchemy.core.getTokenBalances(address);

            const tokensMetadata = [];
            await tokens.tokenBalances.map(async (el) => {
                alchemy.core.getTokenMetadata(el.contractAddress)
                    .then(data => tokensMetadata.push(data))
                    .catch(e => console.log(e));

            });
            setAccountDetails({
                balance,
                transactions,
                nftData,
                tokens,
                tokensMetadata
            });
            setLoading(false);
            setActive("Transactions");
        } catch (error) {
            console.log(error);
        }
    }
    return (
        <StateContext.Provider
            value={{
                address,
                setAddress,
                setAlchemyAPIkey,
                alchemyAPIkey,
                APIs,
                alchemy,
                accountDetails,
                setAccountDetails,
                url,
                setUrl,
                accountsFound,
                setAccountsFound,
                active,
                setActive,
                loading,
                setLoading,
                formatCurrency,
                formatTitle,
                fetchAccounts,
                fetchData,
            }}
        >
            {children}
        </StateContext.Provider>
    )
}

export default Context
