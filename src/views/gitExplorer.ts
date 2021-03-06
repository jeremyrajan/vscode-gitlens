'use strict';
// import { Functions } from '../system';
import { commands, Event, EventEmitter, ExtensionContext, TreeDataProvider, TreeItem, Uri } from 'vscode';
import { UriComparer } from '../comparers';
import { ExplorerNode, FileHistoryNode, RepositoryNode, ResourceType, StashNode } from './explorerNodes';
import { GitService, GitUri } from '../gitService';

export * from './explorerNodes';

export class GitExplorer implements TreeDataProvider<ExplorerNode> {

    // private _refreshDebounced: () => void;

    private _onDidChangeTreeData = new EventEmitter<ExplorerNode>();
    public get onDidChangeTreeData(): Event<ExplorerNode> {
        return this._onDidChangeTreeData.event;
    }

    private _roots: ExplorerNode[] = [];

    constructor(private context: ExtensionContext, private git: GitService) {
        commands.registerCommand('gitlens.gitExplorer.refresh', () => this.refresh());

        // this._refreshDebounced = Functions.debounce(this.refresh.bind(this), 250);

        // const editor = window.activeTextEditor;

        // const uri = (editor !== undefined && editor.document !== undefined)
        //     ? new GitUri(editor.document.uri, { repoPath: git.repoPath, fileName: editor.document.uri.fsPath })
        //     : new GitUri(Uri.file(git.repoPath), { repoPath: git.repoPath, fileName: git.repoPath });

        const uri = new GitUri(Uri.file(git.repoPath), { repoPath: git.repoPath, fileName: git.repoPath });
        this._roots.push(new RepositoryNode(uri, context, git));
    }

    async getTreeItem(node: ExplorerNode): Promise<TreeItem> {
        // if (node.onDidChangeTreeData !== undefined) {
        //     node.onDidChangeTreeData(() => setTimeout(this._refreshDebounced, 1));
        // }
        return node.getTreeItem();
    }

    async getChildren(node?: ExplorerNode): Promise<ExplorerNode[]> {
        if (this._roots.length === 0) return [];
        if (node === undefined) return this._roots;

        return node.getChildren();
    }

    addHistory(uri: GitUri) {
        this._add(uri, FileHistoryNode);
    }

    addStash(uri: GitUri) {
        this._add(uri, StashNode);
    }

    private _add<T extends ExplorerNode>(uri: GitUri, type: { new (uri: GitUri, context: ExtensionContext, git: GitService): T, rootType: ResourceType }) {
        if (!this._roots.some(_ => _.resourceType === type.rootType && UriComparer.equals(uri, _.uri))) {
            this._roots.push(new type(uri, this.context, this.git));
        }
        this.refresh();
    }

    clear() {
        this._roots = [];
        this.refresh();
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }
}