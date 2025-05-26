import { execSync } from "child_process";

export async function initSandbox(boxId: number): Promise<string> {
    try {
        const output = execSync(`isolate --box-id=${boxId} --cg --init`, {
            stdio: ["ignore", "pipe", "inherit"],
        });
        return output.toString().trim();
    } catch (error) {
        console.error(`Failed to initialize sandbox ${boxId}:`, error);
        throw new Error(`Sandbox ${boxId} initialization failed`);
    }
}

export async function cleanupSandbox(boxId: number) {
    try {
        execSync(`isolate --box-id=${boxId} --cg --cleanup`, {
            stdio: ["ignore", "ignore", "inherit"],
        });
    } catch (error) {
        console.error(`Failed to clean up sandbox ${boxId}:`, error);
    }
}
