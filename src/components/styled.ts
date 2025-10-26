import styled from 'styled-components'

export const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #1e1e1e;
  color: #ffffff;
  font-family: 'Courier New', monospace;
  font-size: 14px;
`

export const Header = styled.div`
  background-color: #2d2d2d;
  padding: 8px 16px;
  border-bottom: 1px solid #404040;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

export const Title = styled.h1`
  margin: 0;
  font-size: 18px;
  color: #00ff00;
`

export const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`

export const CopyButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  background-color: #1a1a1a;
  border: 2px solid #404040;
  margin: 4px 0;
  min-width: 60px;
`

export const CopyButton = styled.button`
  background-color: #404040;
  color: #ffffff;
  border: 1px solid #606060;
  padding: 8px 12px;
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
  font-weight: bold;
  border-radius: 2px;
  
  &:hover {
    background-color: #505050;
  }
  
  &:active {
    background-color: #303030;
  }
  
  &:disabled {
    background-color: #2a2a2a;
    color: #666666;
    cursor: not-allowed;
  }
`

export const PaneContainer = styled.div<{ isActive?: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 2px solid ${props => props.isActive ? '#00ff00' : '#404040'};
  margin: 4px;
  background-color: #1a1a1a;
`

export const PaneHeader = styled.div`
  background-color: #2d2d2d;
  padding: 8px 12px;
  border-bottom: 1px solid #404040;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 20px;
`

export const PaneHeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

export const ReloadButton = styled.button`
  background-color: #404040;
  color: #ffffff;
  border: 1px solid #606060;
  padding: 4px 8px;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  border-radius: 2px;
  min-width: 24px;
  
  &:hover {
    background-color: #505050;
  }
  
  &:active {
    background-color: #303030;
  }
  
  &:disabled {
    background-color: #2a2a2a;
    color: #666666;
    cursor: not-allowed;
  }
`

export const PaneTitle = styled.div`
  font-weight: bold;
  color: #00ffff;
`

export const BucketSelector = styled.select`
  background-color: #1e1e1e;
  color: #ffffff;
  border: 1px solid #404040;
  padding: 4px 8px;
  font-family: inherit;
  font-size: 12px;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
  }
  
  &:disabled {
    background-color: #2a2a2a;
    color: #666666;
    cursor: not-allowed;
  }
`

export const FileList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  
  &:focus {
    outline: 2px solid #00ff00;
    outline-offset: -2px;
  }
`

export const FileItem = styled.div<{ selected?: boolean; isFolder?: boolean }>`
  padding: 4px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  background-color: ${props => props.selected ? '#333333' : 'transparent'};
  color: ${props => props.isFolder ? '#ffff00' : '#ffffff'};
  
  &:hover {
    background-color: #2a2a2a;
  }
  
  &:before {
    content: '${props => props.isFolder ? '📁' : '📄'}';
    margin-right: 8px;
    font-size: 12px;
  }
`

export const FileDetails = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`

export const FileName = styled.div`
  flex: 1;
  margin-right: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const FileSize = styled.div`
  color: #aaaaaa;
  font-size: 12px;
  min-width: 80px;
  text-align: right;
`

export const StatusBar = styled.div`
  background-color: #2d2d2d;
  padding: 8px 16px;
  border-top: 1px solid #404040;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #aaaaaa;
`

export const Button = styled.button`
  background-color: #404040;
  color: #ffffff;
  border: 1px solid #606060;
  padding: 6px 12px;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    background-color: #505050;
  }
  
  &:active {
    background-color: #303030;
  }
  
  &:disabled {
    background-color: #2a2a2a;
    color: #666666;
    cursor: not-allowed;
  }
`

export const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`

export const ModalContent = styled.div`
  background-color: #1e1e1e;
  border: 1px solid #404040;
  padding: 24px;
  min-width: 400px;
  max-width: 600px;
`

export const ModalHeader = styled.div`
  color: #00ffff;
  font-size: 16px;
  margin-bottom: 16px;
  font-weight: bold;
`

export const FormGroup = styled.div`
  margin-bottom: 16px;
`

export const Label = styled.label`
  display: block;
  margin-bottom: 4px;
  color: #ffffff;
  font-size: 12px;
`

export const Input = styled.input`
  width: 100%;
  background-color: #2d2d2d;
  color: #ffffff;
  border: 1px solid #404040;
  padding: 8px;
  font-family: inherit;
  font-size: 12px;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
  }
`