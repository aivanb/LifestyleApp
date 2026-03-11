# Page snapshot

```yaml
- generic [ref=e3]:
  - button "Toggle navigation menu" [ref=e4] [cursor=pointer]
  - navigation [ref=e8]:
    - generic [ref=e9]:
      - link "Tracking App" [ref=e10] [cursor=pointer]:
        - /url: /
      - button "Close navigation menu" [ref=e11] [cursor=pointer]: ×
    - list [ref=e13]:
      - listitem [ref=e14]:
        - link "Login" [ref=e15] [cursor=pointer]:
          - /url: /login
          - img [ref=e16]
          - text: Login
      - listitem [ref=e18]:
        - link "Register" [ref=e19] [cursor=pointer]:
          - /url: /register
          - img [ref=e20]
          - text: Register
  - main [ref=e22]:
    - generic [ref=e24]:
      - heading "Login" [level=2] [ref=e25]
      - generic [ref=e26]: Login failed
      - generic [ref=e27]:
        - generic [ref=e28]:
          - generic [ref=e29]: Username
          - textbox "Username" [ref=e30]: testuser
        - generic [ref=e31]:
          - generic [ref=e32]: Password
          - textbox "Password" [ref=e33]: testpass123
        - button "Login" [ref=e34] [cursor=pointer]
      - paragraph [ref=e35]:
        - text: Don't have an account?
        - link "Register here" [ref=e36] [cursor=pointer]:
          - /url: /register
```