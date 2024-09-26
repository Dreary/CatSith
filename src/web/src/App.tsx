import { useEffect, useState } from "react";

function App() {
    const [appVersion, setAppVersion] = useState<string>("1.0.0");

    useEffect(() => {
        (async () => {
            const version = await window.electron.getAppVersion();
            setAppVersion(version);
        })();
    }, []);

    return (
        <>
            <div className="relative h-screen w-screen overflow-hidden">
                <div className="flex h-full w-full flex-col gap-2 text-white">
                    <h1 className="z-10 flex w-full justify-between bg-black/50 p-4 text-[1rem] font-bold drop-shadow-md">
                        <a
                            href="https://github.com/AngeloTadeucci/CatSith"
                            target="_blank"
                        >
                            CatSith
                        </a>
                        v{appVersion}
                    </h1>
                </div>
            </div>
        </>
    );
}

export default App;
