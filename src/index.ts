import type { CallTemplateFunctionArgs, Context, PluginDefinition } from "@yaakapp/api";

import { execSync } from "node:child_process";
import * as path from "path";
import * as fs from "fs/promises";

export const plugin: PluginDefinition = {
    templateFunctions: [
        {
            name: "shell_command",
            description: "Run a shell command.",
            args: [
                {
                    type: "text",
                    name: "cmd",
                    label: "Command",
                },
                {
                    type: "select",
                    name: "interpreter",
                    label: "Shell Intepreter",
                    defaultValue: "sh",
                    options: [
                        { label: "sh", value: "sh" },
                        { label: "bash", value: "bash" },
                        { label: "zsh", value: "zsh" },
                        { label: "fish", value: "fish" },
                    ],
                }
            ],
            onRender: async (
                ctx: Context,
                { values, purpose }: CallTemplateFunctionArgs,
            ): Promise<string | null> => {
                if (!values.cmd || !values.interpreter) return null;

                var interp = await findBinPath(values.interpreter)
                if (interp === null) {
                  const err = `${values.interpreter}: executable not found`
                  console.error(err)
                  return err
                }

                console.log(`Running command with ${values.interpreter}: ${values.cmd}`);

                let out: string;
                try {
                    out = execSync(values.cmd, {
                        shell: values.interpreter,
                        timeout: 10 * 1000,
                        encoding: "utf-8",
                    });
                } catch (err) {
                    const err_m = (err as Error).message;
                    console.error(`Command failed: ${err_m}`);
                    return err_m;
                }

                return out.toString().trim();
            },
        },
    ],
};


async function findBinPath(bin: string) {
    const pathEnv = process.env.PATH || "";
    const pathDirs = pathEnv
        .split(path.delimiter)
        .filter(Boolean);
    const bins = pathDirs.flatMap((dir) => path.join(dir, bin));
    try {
        return await Promise.any(bins.map(statFile));
    } catch (err) {
        return null;
    }

    async function statFile(path: string) {
        if ((await fs.stat(path)).isFile()) {
            return path;
        }
        throw new Error("Not found");
    }
}
