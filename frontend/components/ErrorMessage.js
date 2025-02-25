import { html } from "../common/Preact.js"

const StackFrameFilename = ({ frame, cell_id }) => {
    const sep_index = frame.file.indexOf("#==#")
    if (sep_index != -1) {
        const frame_cell_id = frame.file.substr(sep_index + 4)
        const a = html`<a
            href="#"
            onclick=${(e) => {
                window.dispatchEvent(
                    new CustomEvent("cell_focus", {
                        detail: {
                            cell_id: frame_cell_id,
                            line: frame.line - 1, // 1-based to 0-based index
                        },
                    })
                )
                e.preventDefault()
            }}
        >
            ${frame_cell_id == cell_id ? "Local" : "Other"}: ${frame.line}
        </a>`
        return html`<em>${a}</em>`
    } else {
        return html`<em>${frame.file}:${frame.line}</em>`
    }
}

const Funccall = ({ frame }) => {
    const bracket_index = frame.call.indexOf("(")
    if (bracket_index != -1) {
        return html`<mark><strong>${frame.call.substr(0, bracket_index)}</strong>${frame.call.substr(bracket_index)}</mark>`
    } else {
        return html`<mark><strong>${frame.call}</strong></mark>`
    }
}

export const ErrorMessage = ({ msg, stacktrace, cell_id, requests }) => {
    const rewriters = [
        {
            pattern: /syntax: extra token after end of expression/,
            display: () =>
                html`<p>Multiple expressions in one cell.</p>
                    <a
                        href="#"
                        onClick=${(e) => {
                            e.preventDefault()
                            requests.wrap_remote_cell(cell_id, "begin")
                        }}
                        >Wrap all code in a <em>begin ... end</em> block.</a
                    >`,
        },
        {
            pattern: /LoadError: cannot assign a value to variable workspace\d+\..+ from module workspace\d+/,
            display: () =>
                html`<p>Tried to reevaluate an <code>include</code> call, this is not supported. You might need to restart this notebook from the main menu.</p>
                    <p>
                        For a workaround, use the alternative version of <code>include</code> described here:
                        <a href="https://github.com/fonsp/Pluto.jl/issues/115#issuecomment-661722426">GH issue 115</a>
                    </p>
                    <p>In the future, <code>include</code> will be deprecated, and this will be the default.</p>`,
        },
        {
            pattern: /MethodError: no method matching .*\nClosest candidates are:/,
            display: (x) => x.split("\n").map((line) => html`<p style="white-space: nowrap;">${line}</p>`),
        },
        {
            pattern: /.?/,
            display: (x) => x.split("\n").map((line) => html`<p>${line}</p>`),
        },
    ]

    const matched_rewriter = rewriters.find(({ pattern }) => pattern.test(msg))

    return html`<jlerror>
        <header>
            ${matched_rewriter.display(msg)}
        </header>
        ${stacktrace.length == 0
            ? null
            : html`<section>
                  <ol>
                      ${stacktrace.map(
                          (frame) =>
                              html`<li>
                                  <${Funccall} frame=${frame} />
                                  <span>@</span>
                                  <${StackFrameFilename} frame=${frame} cell_id=${cell_id} />
                                  ${frame.inlined ? html`<span>[inlined]</span>` : null}
                              </li>`
                      )}
                  </ol>
              </section>`}
    </jlerror>`
}
