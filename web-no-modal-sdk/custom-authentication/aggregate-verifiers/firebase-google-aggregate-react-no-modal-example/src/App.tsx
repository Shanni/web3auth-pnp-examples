import { useEffect, useState } from "react";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import {
  WALLET_ADAPTERS,
  CHAIN_NAMESPACES,
  SafeEventEmitterProvider,
} from "@web3auth/base";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import "./App.css";
// import RPC from "./evm.web3";
import RPC from "./evm.ethers";
import { initializeApp } from "firebase/app";
import {
  GithubAuthProvider,
  getAuth,
  signInWithPopup,
  UserCredential,
} from "firebase/auth";

const clientId =
  "BHr_dKcxC0ecKn_2dZQmQeNdjPgWykMkcodEHkVvPMo71qzOV6SgtoN8KCvFdLN7bf34JOm89vWQMLFmSfIo84A"; // get from https://dashboard.web3auth.io

// Your web app's Firebase configuration

const firebaseConfig = {
  apiKey: "AIzaSyAAAF-xdPur0wJpgwXLGdLZWDwRCTRLdX8",
  authDomain: "web3auth-firebase-github.firebaseapp.com",
  projectId: "web3auth-firebase-github",
  storageBucket: "web3auth-firebase-github.appspot.com",
  messagingSenderId: "384159528034",
  appId: "1:384159528034:web:9a9121481ea2948237cd3b",
};

function App() {
  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(
    null
  );
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);


  useEffect(() => {
    const init = async () => {
      try {
        const chainConfig = {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: "0x5", // Please use 0x1 for Mainnet
          rpcTarget: "https://rpc.ankr.com/eth_goerli",
          displayName: "Goerli Testnet",
          blockExplorer: "https://goerli.etherscan.io/",
          ticker: "ETH",
          tickerName: "Ethereum",
        };

        const web3auth = new Web3AuthNoModal({
          clientId,
          chainConfig,
          web3AuthNetwork: "testnet",
          useCoreKitKey: false,
        });

        const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

        const openloginAdapter = new OpenloginAdapter({
          privateKeyProvider,
          adapterSettings: {
            uxMode: "popup",
            loginConfig: {
              google: {
                verifier: "aggregate-verifier-google-firebase",
                verifierSubIdentifier: "w3a-google",
                typeOfLogin: "google",
                clientId:
                  "774338308167-q463s7kpvja16l4l0kko3nb925ikds2p.apps.googleusercontent.com",
              },
              firebaseGithub: {
                verifier: "aggregate-verifier-google-firebase",
                verifierSubIdentifier: "w3a-firebase",
                typeOfLogin: "jwt",
                clientId: "randomString",
              },
            },
          },
        });
        web3auth.configureAdapter(openloginAdapter);
        setWeb3auth(web3auth);

        await web3auth.init();
        setProvider(web3auth.provider);

        if (web3auth.connected) {
          setLoggedIn(true);
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  const loginGoogle = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const web3authProvider = await web3auth.connectTo(
      WALLET_ADAPTERS.OPENLOGIN,
      {
        loginProvider: "google",
      }
    );
    console.log("web3authProvider", web3authProvider)
    setProvider(web3authProvider);
    setLoggedIn(true);
  };

  const signInWithGithub = async (): Promise<UserCredential> => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const githubProvider = new GithubAuthProvider();

    const result = await signInWithPopup(auth, githubProvider);
    return result;
  };

  const loginGitHub = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const loginRes = await signInWithGithub();
    console.log("login details", loginRes);
    const idToken = await loginRes.user.getIdToken(true);
    console.log("idToken", idToken);

    const web3authProvider = await web3auth.connectTo(
      WALLET_ADAPTERS.OPENLOGIN,
      {
        loginProvider: "firebaseGithub",
        extraLoginOptions: {
          id_token: idToken,
          verifierIdField: "email",
          domain: "http://localhost:3000",
        },
      }
    );
    setLoggedIn(true);
    setProvider(web3authProvider);
  };

  const authenticateUser = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const idToken = await web3auth.authenticateUser();
    uiConsole(idToken);
  };

  const getUserInfo = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const user = await web3auth.getUserInfo();
    uiConsole(user);
  };

  const logout = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    await web3auth.logout();
    setLoggedIn(false);
    setProvider(null);
  };

  const getAccounts = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const userAccount = await rpc.getAccounts();
    uiConsole(userAccount);
  };

  const getBalance = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const balance = await rpc.getBalance();
    uiConsole(balance);
  };

  const signMessage = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const result = await rpc.signMessage();
    uiConsole(result);
  };

  const sendTransaction = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const result = await rpc.signAndSendTransaction();
    uiConsole(result);
  };

  function uiConsole(...args: any[]): void {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
  }

  const loginView = (
    <>
      <div className="flex-container">
        <div>
          <button onClick={getUserInfo} className="card">
            Get User Info
          </button>
        </div>
        <div>
          <button onClick={authenticateUser} className="card">
            Get ID Token
          </button>
        </div>
        <div>
          <button onClick={getAccounts} className="card">
            Get Accounts
          </button>
        </div>
        <div>
          <button onClick={getBalance} className="card">
            Get Balance
          </button>
        </div>
        <div>
          <button onClick={signMessage} className="card">
            Sign Message
          </button>
        </div>
        <div>
          <button onClick={sendTransaction} className="card">
            Send Transaction
          </button>
        </div>
        <div>
          <button onClick={logout} className="card">
            Log Out
          </button>
        </div>
      </div>

      <div id="console" style={{ whiteSpace: "pre-line" }}>
        <p style={{ whiteSpace: "pre-line" }}>Logged in Successfully!</p>
      </div>
    </>
  );

  const logoutView = (
    <>
      <button onClick={loginGoogle} className="card">
        Login using <b>Google</b>
      </button>
      <button onClick={loginGitHub} className="card">
        Login using <b>GitHub</b> [ via Firebase ]
      </button>
    </>
  );

  return (
    <div className="container">
      <h1 className="title">
        <a target="_blank" href="http://web3auth.io/" rel="noreferrer">
          Web3Auth
        </a>{" "}
        & Firebase React Example for Google Login
      </h1>

      <div className="grid">{loggedIn ? loginView : logoutView}</div>

      <footer className="footer">
        <a
          href="https://github.com/Web3Auth/examples/tree/main/web-no-modal-sdk/custom-authentication/aggregate-verifiers/firebase-google-aggregate-react-no-modal-example"
          target="_blank"
          rel="noopener noreferrer"
        >
          Source code
        </a>
      </footer>
    </div>
  );
}

export default App;
