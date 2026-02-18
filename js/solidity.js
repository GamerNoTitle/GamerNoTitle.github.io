document.addEventListener('DOMContentLoaded', function() {
    // 寻找所有 class 为 one-dark-pro 的 pre 元素，且未被处理过的
    const codeBlocks = document.querySelectorAll('pre.one-dark-pro:not([data-processed="true"])');
    
    codeBlocks.forEach((block, index) => {
        console.log(`Processing code block ${index + 1}`);
        
        // 标记为已处理，防止重复执行
        block.setAttribute('data-processed', 'true');

        // 处理多重嵌套：如果 block 外层有额外的 pre，移除多余的 pre
        let parentPre = block.parentElement;
        if (parentPre.tagName === 'PRE' && parentPre !== block) {
            unwrap(block, parentPre);
        }

        // 创建自定义包裹元素
        let wrapper = block.closest('div.custom-code-block');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'custom-code-block';
            wrap(block, wrapper);
        }
        console.log('Wrapper created:', wrapper.outerHTML);

        // 移除已存在的 custom-tools（避免重复）
        const existingTools = wrapper.querySelectorAll('.custom-tools');
        existingTools.forEach(tool => tool.remove());

        // 创建新的工具栏
        const tools = document.createElement('div');
        tools.className = 'custom-tools';
        tools.innerHTML = `
            <div class="code-lang">solidity</div>
            <button class="copy-button"><i class="fas fa-paste copy-button"></i></button>
        `;
        wrapper.insertBefore(tools, wrapper.firstChild);
        console.log('Tools added:', tools.outerHTML);

        // 移除已存在的 table 结构或无关包裹（避免重复）
        let existingTable = block.closest('table.code-table');
        if (existingTable) {
            unwrap(block, existingTable);
        }
        let existingCodeWrapper = block.closest('div.code-wrapper');
        if (existingCodeWrapper) {
            unwrap(block, existingCodeWrapper);
        }
        const extraWraps = wrapper.querySelectorAll('div.table-wrap');
        extraWraps.forEach(wrap => wrap.remove());

        // 创建表格结构用于显示行号
        const table = document.createElement('table');
        table.className = 'code-table';
        table.innerHTML = '<tbody><tr><td class="gutter"><pre class="line-numbers"></pre></td><td class="code"></td></tr></tbody>';
        const codeCell = table.querySelector('td.code');

        // 将 block 直接放入 td.code 中
        codeCell.appendChild(block);
        console.log('Block moved to table cell:', codeCell.outerHTML);

        // 将表格添加到 wrapper 中，确保在 tools 之后
        wrapper.appendChild(table);
        console.log('Table added to wrapper:', wrapper.outerHTML);

        // 获取代码行
        const lines = block.querySelectorAll('.line');
        let gutterHTML = '';
        
        // 生成行号
        lines.forEach((_, lineIndex) => {
            gutterHTML += `<span class="line-number">${lineIndex + 1}</span>`;
        });
        table.querySelector('.gutter .line-numbers').innerHTML = gutterHTML;
        console.log('Line numbers added:', gutterHTML);

        // 复制功能
        const copyButton = tools.querySelector('.copy-button');
        copyButton.addEventListener('click', function() {
            let text = '';
            lines.forEach(line => {
                text += line.textContent + '\n';
            });
            navigator.clipboard.writeText(text).then(() => {
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.innerHTML= '<i class="fas fa-paste copy-button"></i>';
                }, 2000);
            }, () => {
                copyButton.textContent = 'Failed!';
                setTimeout(() => {
                    copyButton.innerHTML = '<i class="fas fa-paste copy-button"></i>';
                }, 2000);
            });
        });
    });

    // 辅助函数：将元素包裹在另一个元素中
    function wrap(el, wrapper) {
        el.parentNode.insertBefore(wrapper, el);
        wrapper.appendChild(el);
    }

    // 辅助函数：解除元素的包裹
    function unwrap(el, wrapper) {
        while (wrapper.firstChild) {
            wrapper.parentNode.insertBefore(wrapper.firstChild, wrapper);
        }
        wrapper.parentNode.removeChild(wrapper);
    }
});